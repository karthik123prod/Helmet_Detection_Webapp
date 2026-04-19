"""CRUD operations for detection history."""

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.models import Detection


async def save_detection(db: AsyncSession, detection_data: dict) -> Detection:
    """Save a detection result to the database."""
    det = Detection(**detection_data)
    db.add(det)
    await db.commit()
    await db.refresh(det)
    return det


async def get_detections(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 12,
    source_type: str = None,
) -> tuple:
    """Get paginated detection history."""
    query = select(Detection).order_by(desc(Detection.created_at))

    if source_type:
        query = query.where(Detection.source_type == source_type)

    # Count total
    count_query = select(func.count()).select_from(Detection)
    if source_type:
        count_query = count_query.where(Detection.source_type == source_type)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return items, total


async def get_detection_by_id(db: AsyncSession, detection_id: str) -> Detection:
    """Get a single detection by ID."""
    result = await db.execute(select(Detection).where(Detection.id == detection_id))
    return result.scalar_one_or_none()


async def delete_detection(db: AsyncSession, detection_id: str) -> bool:
    """Delete a detection record."""
    det = await get_detection_by_id(db, detection_id)
    if det:
        await db.delete(det)
        await db.commit()
        return True
    return False


async def get_stats(db: AsyncSession) -> dict:
    """Get aggregate statistics."""
    total_result = await db.execute(select(func.count()).select_from(Detection))
    total = total_result.scalar() or 0

    violations_result = await db.execute(
        select(func.sum(Detection.total_violations)).select_from(Detection)
    )
    total_violations = violations_result.scalar() or 0

    avg_time_result = await db.execute(
        select(func.avg(Detection.inference_time_ms)).select_from(Detection)
    )
    avg_time = avg_time_result.scalar() or 0

    images_result = await db.execute(
        select(func.count()).select_from(Detection).where(Detection.source_type == "image")
    )
    images = images_result.scalar() or 0

    videos_result = await db.execute(
        select(func.count()).select_from(Detection).where(Detection.source_type == "video")
    )
    videos = videos_result.scalar() or 0

    return {
        "total_detections": total,
        "total_violations": total_violations,
        "avg_inference_time_ms": round(avg_time, 1),
        "images_processed": images,
        "videos_processed": videos,
    }
