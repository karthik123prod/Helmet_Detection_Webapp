"""Health check and stats endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.database import get_db
from backend.database import crud

router = APIRouter()


@router.get("/")
async def root():
    return {
        "name": "Helmet & Triple Ride Detection API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/api/v1/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate detection statistics."""
    stats = await crud.get_stats(db)
    return {"success": True, "stats": stats}
