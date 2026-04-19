"""History API — browse and manage past detection results."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.database import get_db
from backend.database import crud

router = APIRouter()


@router.get("/")
async def list_detections(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    source_type: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List past detections with pagination."""
    items, total = await crud.get_detections(db, page=page, per_page=per_page, source_type=source_type)

    data = []
    for item in items:
        data.append({
            "id": item.id,
            "source_type": item.source_type,
            "filename": item.filename,
            "persons_detected": item.persons_detected or 0,
            "motorbikes_detected": item.motorbikes_detected or 0,
            "helmets_detected": item.helmets_detected or 0,
            "plate_number": item.plate_number,
            "total_violations": item.total_violations or 0,
            "violations": item.violations_json or [],
            "inference_time_ms": item.inference_time_ms or 0,
            "result_image_url": item.result_image_path,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        })

    return {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        },
    }


@router.get("/{detection_id}")
async def get_detection(detection_id: str, db: AsyncSession = Depends(get_db)):
    """Get full details for a single detection."""
    item = await crud.get_detection_by_id(db, detection_id)
    if not item:
        raise HTTPException(404, "Detection not found")

    return {
        "success": True,
        "data": {
            "id": item.id,
            "source_type": item.source_type,
            "filename": item.filename,
            "persons_detected": item.persons_detected or 0,
            "motorbikes_detected": item.motorbikes_detected or 0,
            "helmets_detected": item.helmets_detected or 0,
            "plate_number": item.plate_number,
            "plate_confidence": item.plate_confidence,
            "total_violations": item.total_violations or 0,
            "violations": item.violations_json or [],
            "inference_time_ms": item.inference_time_ms or 0,
            "result_image_url": item.result_image_path,
            "full_result": item.full_result_json,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        },
    }


@router.delete("/{detection_id}")
async def delete_detection(detection_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a detection record."""
    deleted = await crud.delete_detection(db, detection_id)
    if not deleted:
        raise HTTPException(404, "Detection not found")
    return {"success": True, "message": "Detection deleted"}
