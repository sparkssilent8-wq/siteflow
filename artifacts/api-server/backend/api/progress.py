import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.models.activity import Activity
from backend.models.progress_update import ProgressUpdate
from backend.models.project import Project
from backend.schemas.schemas import ProgressUpdateCreate, ProgressUpdateResponse
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/progress", tags=["Progress Tracking"])

@router.post("", response_model=ProgressUpdateResponse)
def log_progress_update(req: ProgressUpdateCreate, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == req.activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    prev_pct = act.actual_progress or 0.0
    
    # Create immutable audit record
    pu = ProgressUpdate(
        activity_id=req.activity_id,
        progress_percentage=req.progress_percentage,
        previous_percentage=prev_pct,
        status=req.status or act.status,
        actual_start=req.actual_start or act.actual_start or datetime.datetime.utcnow(),
        actual_finish=req.actual_finish if req.progress_percentage >= 100.0 else act.actual_finish,
        source=req.source or "SITE_UPDATE",
        confidence=req.confidence or 1.0,
        remarks=req.remarks,
        site_update_id=req.site_update_id,
        reviewer_name=req.reviewer_name
    )
    db.add(pu)

    # Update Activity
    act.actual_progress = req.progress_percentage
    if not act.actual_start:
        act.actual_start = pu.actual_start
    if req.progress_percentage >= 100.0 and not act.actual_finish:
        act.actual_finish = datetime.datetime.utcnow()

    db.commit()

    # Recalculate Project Variances
    project = db.query(Project).filter(Project.id == act.project_id).first()
    if project:
        variance_engine.update_project_variances(db, project)

    db.refresh(pu)
    return pu

@router.get("/activity/{activity_id}", response_model=List[ProgressUpdateResponse])
def get_activity_progress_history(activity_id: int, db: Session = Depends(get_db)):
    updates = db.query(ProgressUpdate).filter(
        ProgressUpdate.activity_id == activity_id
    ).order_by(ProgressUpdate.created_at.desc()).all()
    return updates
