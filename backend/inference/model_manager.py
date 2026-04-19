"""
Model Manager — Singleton lazy loader for all ML models.
Ensures models are loaded only once and shared across requests.
"""

from loguru import logger
from backend.config import settings


class ModelManager:
    """Thread-safe singleton that lazy-loads all ML models."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._bike_person = None
            cls._instance._helmet = None
            cls._instance._plate = None
        return cls._instance

    @property
    def bike_person_detector(self):
        if self._bike_person is None:
            from backend.inference.bike_person_detector import BikePersonDetector
            self._bike_person = BikePersonDetector(
                cfg_path=settings.YOLO_COCO_CFG,
                weights_path=settings.YOLO_COCO_WEIGHTS,
                labels_path=settings.YOLO_COCO_LABELS,
            )
        return self._bike_person

    @property
    def helmet_detector(self):
        if self._helmet is None:
            from backend.inference.helmet_detector import HelmetDetector
            self._helmet = HelmetDetector(
                cfg_path=settings.YOLO_HELMET_CFG,
                weights_path=settings.YOLO_HELMET_WEIGHTS,
            )
        return self._helmet

    @property
    def plate_classifier(self):
        if self._plate is None:
            from backend.inference.plate_classifier import PlateClassifier
            self._plate = PlateClassifier(
                model_json=settings.CNN_PLATE_JSON,
                weights_path=settings.CNN_PLATE_WEIGHTS,
                labels_path=settings.CNN_PLATE_LABELS,
            )
        return self._plate

    @property
    def is_ready(self) -> bool:
        return self._bike_person is not None
