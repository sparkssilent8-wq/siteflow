from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.models.india_project import IndiaProject


router = APIRouter(prefix="/api/india-projects", tags=["India Construction Projects"])

SORT_FIELDS = {
    "name": IndiaProject.name,
    "location": IndiaProject.location,
    "category": IndiaProject.category,
    "status": IndiaProject.status,
    "verified": IndiaProject.last_verified_at,
}


def serialize_project(project: IndiaProject):
    return {
        "id": project.id,
        "name": project.name,
        "category": project.category,
        "location": project.location,
        "status": project.status,
        "description": project.description,
        "key_facts": project.key_facts or [],
        "official_source_url": project.official_source_url,
        "image_url": project.image_url,
        "latitude": project.latitude,
        "longitude": project.longitude,
        "last_verified_at": project.last_verified_at,
        "source_note": project.source_note,
        "tags": project.tags or [],
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("")
def list_india_projects(
    q: Optional[str] = Query(default=None, max_length=120),
    category: Optional[str] = Query(default=None, max_length=100),
    location: Optional[str] = Query(default=None, max_length=120),
    status: Optional[str] = Query(default=None, max_length=100),
    sort: str = Query(default="name", pattern="^(name|location|category|status|verified)$"),
    db: Session = Depends(get_db),
):
    query = db.query(IndiaProject)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            IndiaProject.name.ilike(term),
            IndiaProject.description.ilike(term),
            IndiaProject.location.ilike(term),
        ))
    if category and category != "All":
        query = query.filter(IndiaProject.category == category)
    if location and location != "All":
        query = query.filter(IndiaProject.location.ilike(f"%{location}%"))
    if status and status != "All":
        query = query.filter(IndiaProject.status == status)

    sort_column = SORT_FIELDS[sort]
    projects = query.order_by(sort_column.asc().nullslast(), IndiaProject.name.asc()).all()
    categories = [row[0] for row in db.query(IndiaProject.category).distinct().order_by(IndiaProject.category).all()]
    locations = [row[0] for row in db.query(IndiaProject.location).distinct().order_by(IndiaProject.location).all()]
    statuses = [row[0] for row in db.query(IndiaProject.status).distinct().order_by(IndiaProject.status).all()]
    return {
        "items": [serialize_project(project) for project in projects],
        "total": len(projects),
        "filters": {"categories": categories, "locations": locations, "statuses": statuses},
    }


@router.get("/{project_id}")
def get_india_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(IndiaProject).filter(IndiaProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="India project not found")
    return serialize_project(project)