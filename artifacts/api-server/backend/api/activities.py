from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.database import get_db
from backend.models.activity import Activity
from backend.models.progress_update import ProgressUpdate
from backend.models.risk_prediction import RiskPrediction
from backend.models.recommendation import Recommendation
from backend.schemas.schemas import ActivityCreate, ActivityUpdate, ActivityResponse
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/activities", tags=["Activities"])

@router.get("/project/{project_id}", response_model=List[ActivityResponse])
def list_activities(
    project_id: int,
    discipline: Optional[str] = None,
    wbs_level: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    l5_l6_only: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(Activity).filter(Activity.project_id == project_id)
    
    if discipline and discipline != "ALL":
        query = query.filter(Activity.discipline.ilike(f"%{discipline}%"))
    if wbs_level and wbs_level != "ALL":
        query = query.filter(Activity.wbs_level == wbs_level)
    if l5_l6_only:
        query = query.filter(Activity.wbs_level.in_(["L5", "L6"]))
    if status and status != "ALL":
        query = query.filter(Activity.status == status)
    if risk_level and risk_level != "ALL":
        query = query.filter(Activity.risk_level == risk_level)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Activity.activity_code.ilike(s)) | 
            (Activity.activity_name.ilike(s)) |
            (Activity.notes.ilike(s))
        )

    activities = query.order_by(Activity.wbs_code.asc(), Activity.activity_code.asc()).all()
    return activities

@router.get("/{activity_id}")
def get_activity_detail(activity_id: int, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    progress_history = db.query(ProgressUpdate).filter(
        ProgressUpdate.activity_id == activity_id
    ).order_by(ProgressUpdate.created_at.asc()).all()

    latest_risk = db.query(RiskPrediction).filter(
        RiskPrediction.activity_id == activity_id
    ).order_by(RiskPrediction.created_at.desc()).first()

    recommendations = db.query(Recommendation).filter(
        Recommendation.activity_id == activity_id
    ).all()

    return {
        "activity": ActivityResponse.model_validate(act),
        "progress_history": progress_history,
        "latest_risk": latest_risk,
        "recommendations": recommendations
    }

@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(activity_id: int, req: ActivityUpdate, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    if req.actual_progress is not None:
        act.actual_progress = req.actual_progress
    if req.status is not None:
        act.status = req.status
    if req.actual_start is not None:
        act.actual_start = req.actual_start
    if req.actual_finish is not None:
        act.actual_finish = req.actual_finish
    if req.risk_level is not None:
        act.risk_level = req.risk_level
    if req.notes is not None:
        act.notes = req.notes

    db.commit()
    db.refresh(act)
    return act
