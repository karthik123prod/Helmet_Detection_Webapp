"""
Detection Service — Orchestrates the 3-stage inference pipeline.
Stage 1: Detect person + motorbike (YOLOv3 COCO)
Stage 2: Detect helmets (YOLOv3 Custom)
Stage 3: Classify number plate (CNN Demo)
"""

import cv2
import time
import uuid
import numpy as np
from pathlib import Path
from loguru import logger
from datetime import datetime, timezone

from backend.config import settings
from backend.inference.model_manager import ModelManager


class DetectionService:
    """Full detection pipeline for images and videos."""

    def __init__(self):
        self.models = ModelManager()

    def detect_image(self, image_bytes: bytes, confidence: float = 0.5) -> dict:
        """
        Run full 3-stage pipeline on an image.

        Returns detection results, violations, and annotated image path.
        """
        start = time.time()

        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode image")

        result = self._process_frame(frame, confidence)

        elapsed = round((time.time() - start) * 1000, 1)
        result["inference_time_ms"] = elapsed

        return result

    def detect_video(
        self,
        video_path: str,
        confidence: float = 0.5,
        skip_frames: int = 2,
        max_frames: int = 300,
    ) -> dict:
        """Process video file frame by frame."""
        start = time.time()

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        results = {
            "video_info": {
                "fps": round(fps, 1),
                "total_frames": total_frame_count,
                "duration_sec": round(total_frame_count / fps, 1) if fps > 0 else 0,
            },
            "frames_processed": 0,
            "total_violations": 0,
            "violations": [],
            "violation_frames": [],
        }

        frame_num = 0
        processed = 0

        while processed < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            frame_num += 1
            if frame_num % (skip_frames + 1) != 0:
                continue

            processed += 1
            try:
                frame_result = self._process_frame(frame, confidence)

                if frame_result["violations"]:
                    for v in frame_result["violations"]:
                        v["frame_number"] = frame_num
                        v["timestamp_sec"] = round(frame_num / fps, 2)
                    results["violations"].extend(frame_result["violations"])

                    # Save violation frame
                    if frame_result.get("annotated_frame") is not None:
                        vio_dir = Path(settings.OUTPUT_DIR) / "violations"
                        vio_dir.mkdir(parents=True, exist_ok=True)
                        vio_id = uuid.uuid4().hex[:8]
                        vio_path = vio_dir / f"vio_{vio_id}_f{frame_num}.jpg"
                        cv2.imwrite(str(vio_path), frame_result["annotated_frame"])
                        results["violation_frames"].append(f"/files/outputs/violations/{vio_path.name}")
            except Exception as e:
                logger.warning(f"Frame {frame_num} processing error: {e}")
                continue

        cap.release()

        results["frames_processed"] = processed
        results["total_violations"] = len(results["violations"])
        results["processing_time_ms"] = round((time.time() - start) * 1000, 1)

        return results

    def _process_frame(self, frame: np.ndarray, confidence: float = 0.5) -> dict:
        """Run the 3-stage pipeline on a single frame."""
        result = {
            "stage1_bike_person": None,
            "stage2_helmet": None,
            "stage3_plate": None,
            "violations": [],
            "annotated_frame": None,
        }

        # ---- Stage 1: Detect person + motorbike ----
        stage1 = self.models.bike_person_detector.detect(frame, confidence)
        result["stage1_bike_person"] = {
            "persons": stage1["persons"],
            "motorbikes": stage1["motorbikes"],
            "detections": stage1["detections"],
        }

        # Draw Stage 1 detections
        annotated = self.models.bike_person_detector.draw_detections(frame, stage1["detections"])

        if stage1["motorbikes"] == 0 and stage1["persons"] == 0:
            result["annotated_frame"] = annotated
            return result

        # Check triple riding
        if stage1["persons"] >= settings.TRIPLE_RIDE_MIN_PERSONS:
            result["violations"].append({
                "type": "triple_riding",
                "severity": "critical",
                "details": f"{stage1['persons']} persons detected on motorbike",
            })

        # ---- Stage 2: Detect helmets ----
        stage2 = self.models.helmet_detector.detect(frame, confidence=0.6)
        result["stage2_helmet"] = {
            "helmets": stage2["helmets"],
            "helmet_detections": stage2["helmet_detections"],
        }

        # Draw helmet detections
        annotated = self.models.helmet_detector.draw_detections(annotated, stage2["helmet_detections"])

        # Check helmet violations
        if stage1["persons"] > 0 and stage2["helmets"] < stage1["persons"]:
            result["violations"].append({
                "type": "no_helmet",
                "severity": "high",
                "details": f"{stage2['helmets']} helmet(s) for {stage1['persons']} person(s)",
            })

        # ---- Stage 3: Number plate (only on violation) ----
        if result["violations"]:
            stage3 = self.models.plate_classifier.predict(frame)
            result["stage3_plate"] = stage3

            # Draw violation text on image
            cv2.putText(
                annotated,
                "VIOLATION DETECTED",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                3,
            )

            # Draw plate text
            if stage3.get("plate"):
                cv2.putText(
                    annotated,
                    f"Plate: {stage3['plate']}",
                    (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 255),
                    2,
                )

        result["annotated_frame"] = annotated
        return result

    def save_annotated_image(self, annotated_frame: np.ndarray) -> str:
        """Save annotated image and return URL path."""
        output_dir = Path(settings.OUTPUT_DIR) / "results"
        output_dir.mkdir(parents=True, exist_ok=True)

        result_id = uuid.uuid4().hex[:8]
        filename = f"result_{result_id}.jpg"
        filepath = output_dir / filename
        cv2.imwrite(str(filepath), annotated_frame)

        return f"/files/outputs/results/{filename}"
