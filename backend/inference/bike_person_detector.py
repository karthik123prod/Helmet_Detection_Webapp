"""
Bike & Person Detector — YOLOv3 COCO Model
Uses your existing yolov3.weights trained on COCO dataset,
filtered to detect only person (class 0) and motorbike (class 3).
The custom labels file maps: 0=person, 1=motorbike.
"""

import cv2
import numpy as np
from pathlib import Path
from loguru import logger


class BikePersonDetector:
    """Detects persons and motorbikes using YOLOv3 COCO via OpenCV DNN."""

    def __init__(self, cfg_path: str, weights_path: str, labels_path: str):
        if not Path(cfg_path).exists():
            raise FileNotFoundError(f"YOLO config not found: {cfg_path}")
        if not Path(weights_path).exists():
            raise FileNotFoundError(f"YOLO weights not found: {weights_path}")

        self.labels = open(labels_path).read().strip().split('\n')
        logger.info(f"Bike/Person labels: {self.labels}")

        # Integrity check: YOLOv3 weight file should be ~248MB
        weights_size = Path(weights_path).stat().st_size
        if weights_size < 1_000_000:
            logger.error(f"FATAL: Weights file {weights_path} is too small ({weights_size} bytes). Likely a Git LFS pointer.")
            raise ValueError(f"Corrupted weights file: {weights_path}")

        # Use readNet for better compatibility with different OpenCV builds
        self.net = cv2.dnn.readNet(weights_path, cfg_path)
        self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

        # Get output layer names
        layer_names = self.net.getLayerNames()
        out_layers = self.net.getUnconnectedOutLayers()
        if isinstance(out_layers, np.ndarray) and out_layers.ndim > 1:
            self._output_layers = [layer_names[i[0] - 1] for i in out_layers]
        else:
            self._output_layers = [layer_names[i - 1] for i in out_layers]

        logger.info("✅ Bike/Person YOLO model loaded")

    def detect(self, frame: np.ndarray, confidence: float = 0.5, nms_threshold: float = 0.3) -> dict:
        """
        Detect persons and motorbikes in a frame.
        Returns dict with counts and detection details.
        """
        h, w = frame.shape[:2]

        blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (416, 416), swapRB=True, crop=False)
        self.net.setInput(blob)
        outputs = self.net.forward(self._output_layers)

        boxes, confidences, class_ids = [], [], []

        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                conf = float(detection[4] * scores[class_id])

                # COCO Dataset IDs: 0=person, 1=bicycle, 2=car, 3=motorbike
                COCO_PERSON = 0
                COCO_MOTORBIKE = 3

                if conf > confidence and class_id in [COCO_PERSON, COCO_MOTORBIKE]:
                    # Map to our labels: index 0 (person) or 1 (motorbike)
                    mapped_id = 0 if class_id == COCO_PERSON else 1
                    
                    center_x = int(detection[0] * w)
                    center_y = int(detection[1] * h)
                    box_w = int(detection[2] * w)
                    box_h = int(detection[3] * h)
                    x = int(center_x - box_w / 2)
                    y = int(center_y - box_h / 2)

                    boxes.append([x, y, box_w, box_h])
                    confidences.append(conf)
                    class_ids.append(mapped_id)

        indices = cv2.dnn.NMSBoxes(boxes, confidences, confidence, nms_threshold)

        detections = []
        persons, motorbikes = 0, 0

        if len(indices) > 0:
            flat = indices.flatten() if isinstance(indices, np.ndarray) else indices
            for i in flat:
                label_name = self.labels[class_ids[i]] if class_ids[i] < len(self.labels) else "unknown"
                det = {
                    "bbox": boxes[i],
                    "confidence": round(confidences[i], 4),
                    "class_id": int(class_ids[i]),
                    "class_name": label_name,
                }
                detections.append(det)
                if class_ids[i] == 0:
                    persons += 1
                elif class_ids[i] == 1:
                    motorbikes += 1

        return {
            "persons": persons,
            "motorbikes": motorbikes,
            "detections": detections,
        }

    def draw_detections(self, frame: np.ndarray, detections: list) -> np.ndarray:
        """Draw bounding boxes for person/motorbike detections."""
        annotated = frame.copy()
        colors = {0: (0, 255, 255), 1: (255, 165, 0)}  # person=cyan, motorbike=orange

        for det in detections:
            x, y, bw, bh = det["bbox"]
            color = colors.get(det["class_id"], (0, 255, 0))
            cv2.rectangle(annotated, (x, y), (x + bw, y + bh), color, 2)

            label = f"{det['class_name']}: {det['confidence']:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated, (x, y - th - 8), (x + tw + 4, y), color, -1)
            cv2.putText(annotated, label, (x + 2, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

        return annotated
