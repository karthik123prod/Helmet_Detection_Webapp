"""SQLAlchemy ORM models for detection history."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from backend.database.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(50), primary_key=True)
    source_type = Column(String(20), nullable=False, index=True)  # "image" or "video"
    filename = Column(String(255), nullable=False)

    # Stage 1 results
    persons_detected = Column(Integer, default=0)
    motorbikes_detected = Column(Integer, default=0)

    # Stage 2 results
    helmets_detected = Column(Integer, default=0)

    # Stage 3 results
    plate_number = Column(String(30), nullable=True)
    plate_confidence = Column(Float, nullable=True)

    # Violations
    total_violations = Column(Integer, default=0)
    violations_json = Column(JSON, nullable=True)

    # Performance
    inference_time_ms = Column(Float, default=0.0)

    # Files
    result_image_path = Column(String(500), nullable=True)
    original_file_path = Column(String(500), nullable=True)

    # Full result data
    full_result_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
