"""
FastAPI Backend — Main Application
Helmet & Triple Ride Detection System
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
from backend.database.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    logger.info("🚀 Starting Helmet Detection API...")

    # Create runtime directories
    for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, "logs"]:
        Path(d).mkdir(parents=True, exist_ok=True)

    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")
    logger.info("✅ API server ready at http://{}:{}", settings.APP_HOST, settings.APP_PORT)

    yield

    logger.info("🛑 Shutting down...")


app = FastAPI(
    title="Helmet & Triple Ride Detection API",
    description="AI-powered traffic safety monitoring — upload images/videos for real-time violation detection",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from backend.api.health import router as health_router
from backend.api.detection import router as detection_router
from backend.api.history import router as history_router

app.include_router(health_router, tags=["Health"])
app.include_router(detection_router, prefix="/api/v1/detect", tags=["Detection"])
app.include_router(history_router, prefix="/api/v1/history", tags=["History"])

# Serve data directory for uploads/outputs
data_dir = Path("data")
data_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(data_dir)), name="files")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_DEBUG,
        workers=1,
    )
