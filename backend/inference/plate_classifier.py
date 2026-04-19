"""
Number Plate Classifier — CNN Demo Model
Uses the existing Keras Sequential CNN that classifies images
into one of 20 pre-defined number plates.

NOTE: This is a DEMO classifier, not real OCR.
For production, replace with EasyOCR or PaddleOCR.
"""

import cv2
import numpy as np
from pathlib import Path
from loguru import logger


class PlateClassifier:
    """CNN-based number plate classifier (demo mode — 20 fixed plates)."""

    def __init__(self, model_json: str, weights_path: str, labels_path: str):
        self.model = None
        self.labels = []
        self._model_json = model_json
        self._weights_path = weights_path
        self._labels_path = labels_path
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy load the TensorFlow model."""
        if self._loaded:
            return

        if not Path(self._model_json).exists():
            logger.warning(f"Plate model JSON not found: {self._model_json}")
            return
        if not Path(self._weights_path).exists():
            logger.warning(f"Plate model weights not found: {self._weights_path}")
            return

        try:
            import os
            os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

            from tf_keras.models import model_from_json

            with open(self._model_json, 'r') as f:
                self.model = model_from_json(f.read())
            self.model.load_weights(self._weights_path)

            if Path(self._labels_path).exists():
                with open(self._labels_path, 'r') as f:
                    self.labels = [line.strip() for line in f.readlines() if line.strip()]

            self._loaded = True
            logger.info(f"✅ Plate CNN model loaded ({len(self.labels)} classes)")
        except Exception as e:
            logger.error(f"Failed to load plate model: {e}")

    def predict(self, frame: np.ndarray) -> dict:
        """
        Predict number plate from image.
        Returns plate string, confidence, and mode indicator.
        """
        self._ensure_loaded()

        if self.model is None or not self.labels:
            return {
                "plate": None,
                "confidence": 0.0,
                "mode": "unavailable",
                "note": "Plate model not loaded",
            }

        try:
            img = cv2.resize(frame, (64, 64))
            arr = np.array(img).reshape(1, 64, 64, 3) / 255.0
            preds = self.model.predict(arr, verbose=0)
            idx = int(np.argmax(preds))
            conf = float(preds[0][idx])

            return {
                "plate": self.labels[idx] if idx < len(self.labels) else "UNKNOWN",
                "confidence": round(conf, 4),
                "mode": "demo_classifier",
                "note": "Classification-based (20 fixed plates). Not real OCR.",
            }
        except Exception as e:
            logger.error(f"Plate prediction failed: {e}")
            return {
                "plate": None,
                "confidence": 0.0,
                "mode": "error",
                "note": str(e),
            }
