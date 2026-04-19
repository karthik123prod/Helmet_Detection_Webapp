"""Detection API — image and video upload + inference."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from backend.config import settings
from backend.database.database import get_db
from backend.database import crud
from backend.services.detection_service import DetectionService
from backend.services.notification_service import send_violation_email_sync
from pathlib import Path

router = APIRouter()

# Lazy-loaded service
_service = None

def get_service() -> DetectionService:
    global _service
    if _service is None:
        _service = DetectionService()
    return _service


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/avi", "video/x-msvideo", "video/quicktime", "video/webm"}


@router.post("/image")
async def detect_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    confidence: float = Query(0.5, ge=0.1, le=1.0),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an image and run the full helmet/triple-ride detection pipeline.
    Returns detection results with bounding boxes, violations, and annotated image.
    """
    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (jpg, png, webp)")

    try:
        # Read file
        contents = await file.read()

        # Validate size
        size_mb = len(contents) / (1024 * 1024)
        if size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(400, f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit (got {size_mb:.1f}MB)")

        # Run detection
        service = get_service()
        result = service.detect_image(contents, confidence=confidence)

        # Save annotated image
        result_image_url = None
        if result.get("annotated_frame") is not None:
            result_image_url = service.save_annotated_image(result["annotated_frame"])

        # Remove non-serializable frame from result
        result.pop("annotated_frame", None)

        # Generate detection ID
        det_id = f"det_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"

        # Save to database
        try:
            await crud.save_detection(db, {
                "id": det_id,
                "source_type": "image",
                "filename": file.filename or "unknown.jpg",
                "persons_detected": result.get("stage1_bike_person", {}).get("persons", 0),
                "motorbikes_detected": result.get("stage1_bike_person", {}).get("motorbikes", 0),
                "helmets_detected": result.get("stage2_helmet", {}).get("helmets", 0) if result.get("stage2_helmet") else 0,
                "plate_number": result.get("stage3_plate", {}).get("plate") if result.get("stage3_plate") else None,
                "plate_confidence": result.get("stage3_plate", {}).get("confidence") if result.get("stage3_plate") else None,
                "total_violations": len(result.get("violations", [])),
                "violations_json": result.get("violations", []),
                "inference_time_ms": result.get("inference_time_ms", 0),
                "result_image_path": result_image_url,
                "full_result_json": result,
            })
        except Exception as e:
            logger.warning(f"DB save failed (non-critical): {e}")

        # Send email alert in background if there are violations
        if result.get("violations"):
            background_tasks.add_task(
                send_violation_email_sync,
                det_id,
                result["violations"],
                result_image_url
            )

        return JSONResponse(content={
            "success": True,
            "detection_id": det_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "filename": file.filename,
            "inference_time_ms": result.get("inference_time_ms", 0),
            "detection": {
                "stage1_bike_person": result.get("stage1_bike_person"),
                "stage2_helmet": result.get("stage2_helmet"),
                "stage3_plate": result.get("stage3_plate"),
            },
            "violations": result.get("violations", []),
            "result_image_url": result_image_url,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Detection failed: {str(e)}")


@router.post("/video")
async def detect_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    confidence: float = Query(0.5, ge=0.1, le=1.0),
    skip_frames: int = Query(2, ge=0, le=30),
    max_frames: int = Query(300, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a video and run detection on sampled frames.
    Returns aggregated violation results.
    """
    content_type = file.content_type or ""
    if not (content_type.startswith("video/") or file.filename.endswith(('.mp4', '.avi', '.mov'))):
        raise HTTPException(400, "File must be a video (mp4, avi, mov)")

    try:
        # Save uploaded video to disk
        contents = await file.read()
        size_mb = len(contents) / (1024 * 1024)
        if size_mb > 100:
            raise HTTPException(400, f"Video exceeds 100MB limit (got {size_mb:.1f}MB)")

        upload_dir = Path(settings.UPLOAD_DIR) / "videos"
        upload_dir.mkdir(parents=True, exist_ok=True)
        video_id = uuid.uuid4().hex[:8]
        video_path = upload_dir / f"upload_{video_id}.mp4"

        with open(video_path, 'wb') as f:
            f.write(contents)

        # Process video
        service = get_service()
        result = service.detect_video(
            str(video_path),
            confidence=confidence,
            skip_frames=skip_frames,
            max_frames=max_frames,
        )

        # Generate detection ID
        det_id = f"det_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"

        # Save to database
        try:
            await crud.save_detection(db, {
                "id": det_id,
                "source_type": "video",
                "filename": file.filename or "unknown.mp4",
                "total_violations": result.get("total_violations", 0),
                "violations_json": result.get("violations", []),
                "inference_time_ms": result.get("processing_time_ms", 0),
                "full_result_json": result,
            })
        except Exception as e:
            logger.warning(f"DB save failed (non-critical): {e}")

        # Cleanup temp video
        try:
            video_path.unlink()
        except Exception:
            pass

        # Send email alert in background if there are violations
        if result.get("violations"):
            background_tasks.add_task(
                send_violation_email_sync,
                det_id,
                result["violations"]
            )

        return JSONResponse(content={
            "success": True,
            "detection_id": det_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "filename": file.filename,
            "results": result,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video detection error: {e}")
        raise HTTPException(500, f"Video processing failed: {str(e)}")


@router.get("/status")
async def detection_status():
    """Get model loading status."""
    try:
        service = get_service()
        return {
            "status": "ready" if service.models.is_ready else "loading",
            "models_loaded": service.models.is_ready,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
