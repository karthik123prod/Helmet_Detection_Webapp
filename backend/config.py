"""Backend configuration via environment variables."""

import json
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_DEBUG: bool = False

    # Models
    YOLO_COCO_CFG: str = "models/yolov3model/yolov3.cfg"
    YOLO_COCO_WEIGHTS: str = "models/yolov3model/yolov3.weights"
    YOLO_COCO_LABELS: str = "models/yolov3model/yolov3-labels"
    YOLO_HELMET_CFG: str = "models/helmet/yolov3-obj.cfg"
    YOLO_HELMET_WEIGHTS: str = "models/helmet/yolov3-obj_2400.weights"
    CNN_PLATE_JSON: str = "models/plate/model.json"
    CNN_PLATE_WEIGHTS: str = "models/plate/model_weights.h5"
    CNN_PLATE_LABELS: str = "models/plate/labels.txt"

    # Detection
    CONFIDENCE_THRESHOLD: float = 0.5
    NMS_THRESHOLD: float = 0.3
    INPUT_SIZE: int = 416
    TRIPLE_RIDE_MIN_PERSONS: int = 3

    # Storage
    UPLOAD_DIR: str = "data/uploads"
    OUTPUT_DIR: str = "data/outputs"
    MAX_FILE_SIZE_MB: int = 50

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/helmet_detection.db"

    # Email
    SENDER_EMAIL: str = ""
    SENDER_PASSWORD: str = ""
    RECEIVER_EMAIL: str = ""
    ENABLE_EMAIL_ALERTS: bool = False

    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> list:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
