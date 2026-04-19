"""
Helmet Detector — Custom YOLOv3 Model
Uses your custom-trained yolov3-obj_2400.weights (single class: Helmet).
Detects helmets in the scene and counts them.
"""

import cv2
import numpy as np
from pathlib import Path
from loguru import logger


class HelmetDetector:
    """Detects helmets using custom-trained YOLOv3 via OpenCV DNN."""

    def __init__(self, cfg_path: str, weights_path: str):
        if not Path(cfg_path).exists():
            raise FileNotFoundError(f"Helmet cfg not found: {cfg_path}")
        if not Path(weights_path).exists():
            raise FileNotFoundError(f"Helmet weights not found: {weights_path}")

        self.net = cv2.dnn.readNetFromDarknet(cfg_path, weights_path)
        self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

        layer_names = self.net.getLayerNames()
        out_layers = self.net.getUnconnectedOutLayers()
        if isinstance(out_layers, np.ndarray) and out_layers.ndim > 1:
            self._output_layers = [layer_names[i[0] - 1] for i in out_layers]
        else:
            self._output_layers = [layer_names[i - 1] for i in out_layers]

        logger.info("✅ Helmet YOLO model loaded")

    def detect(self, frame: np.ndarray, confidence: float = 0.6, nms_threshold: float = 0.3) -> dict:
        """
        Detect helmets in frame.
        Returns dict with helmet count and detections.
        """
        h, w = frame.shape[:2]

        blob = cv2.dnn.blobFromImage(frame, 1 / 255, (416, 416), [0, 0, 0], 1, crop=False)
        self.net.setInput(blob)
        outputs = self.net.forward(self._output_layers)

        boxes, confidences_list, class_ids = [], [], []

        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = np.argmax(scores)
                conf = float(detection[4] * scores[class_id])

                if conf > confidence:
                    center_x = int(detection[0] * w)
                    center_y = int(detection[1] * h)
                    box_w = int(detection[2] * w)
                    box_h = int(detection[3] * h)
                    x = int(center_x - box_w / 2)
                    y = int(center_y - box_h / 2)

                    boxes.append([x, y, box_w, box_h])
                    confidences_list.append(conf)
                    class_ids.append(class_id)

        indices = cv2.dnn.NMSBoxes(boxes, confidences_list, confidence, nms_threshold)

        helmet_detections = []
        if len(indices) > 0:
            flat = indices.flatten() if isinstance(indices, np.ndarray) else indices
            for i in flat:
                helmet_detections.append({
                    "bbox": boxes[i],
                    "confidence": round(confidences_list[i], 4),
                    "label": f"Helmet: {confidences_list[i]:.2f}",
                })

        return {
            "helmets": len(helmet_detections),
            "helmet_detections": helmet_detections,
        }

    def draw_detections(self, frame: np.ndarray, detections: list) -> np.ndarray:
        """Draw helmet bounding boxes in green."""
        annotated = frame.copy()
        for det in detections:
            x, y, bw, bh = det["bbox"]
            cv2.rectangle(annotated, (x, y), (x + bw, y + bh), (0, 255, 0), 2)

            label = det["label"]
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            top = max(y, th)
            cv2.rectangle(annotated, (x, top - th), (x + tw, top + 4), (0, 255, 0), -1)
            cv2.putText(annotated, label, (x, top), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

        return annotated
