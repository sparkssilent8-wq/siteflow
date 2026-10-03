import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Ensure siteflow root is on PYTHONPATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from backend.database.database import engine
from backend.database.init_db import init_db
from backend.api import (
    projects, activities, schedule, progress, 
    matching, site_updates, review, variance, 
    analytics, reports, ml_proxy, time_agent, india_projects
)
from backend.services.ml_client import ml_client, MLServiceError

app = FastAPI(
    title="SITEFLOW API",
    description="Planning-to-Execution Intelligence for Infrastructure Projects (SIH 2026 Problem 26122)",
    version="1.0.0"
)

# Initialize database schema on startup
init_db()

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(projects.router)
app.include_router(activities.router)
app.include_router(schedule.router)
app.include_router(progress.router)
app.include_router(matching.router)
app.include_router(site_updates.router)
app.include_router(review.router)
app.include_router(variance.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(ml_proxy.router)
app.include_router(time_agent.router)
app.include_router(india_projects.router)

# Mount uploads directory for photos/reports
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/health")
async def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "disconnected"

    try:
        await ml_client.health()
        ml_status = "connected"
    except MLServiceError:
        ml_status = "degraded"
    return {
        "status": "healthy" if database_status == "connected" else "degraded",
        "app": "SITEFLOW Backend",
        "version": "1.0.0",
        "database": database_status,
        "ml_engine": "Backend HTTP client -> independent ML microservice",
        "ml_status": ml_status,
    }

@app.get("/")
def root():
    return {
        "app": "SITEFLOW",
        "tagline": "Planning-to-Execution Intelligence for Infrastructure Projects",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
