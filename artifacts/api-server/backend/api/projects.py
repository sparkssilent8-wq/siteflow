import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.models.match_result import MatchResult
from backend.models.progress_update import ProgressUpdate
from backend.models.recommendation import Recommendation
from backend.models.report import Report
from backend.models.review_decision import ReviewDecision
from backend.models.risk_prediction import RiskPrediction
from backend.models.site_update import SiteUpdate
from backend.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/projects", tags=["Projects"])
logger = logging.getLogger(__name__)

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        act_count = db.query(Activity).filter(Activity.project_id == p.id).count()
        pending_count = db.query(SiteUpdate).filter(
            SiteUpdate.project_id == p.id,
            SiteUpdate.review_status == "PENDING"
        ).count()
        p_dict = {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description,
            "location": p.location,
            "client": p.client,
            "contractor": p.contractor,
            "baseline_start": p.baseline_start,
            "baseline_finish": p.baseline_finish,
            "current_snapshot_date": p.current_snapshot_date,
            "status": p.status,
            "overall_planned_progress": p.overall_planned_progress or 0.0,
            "overall_actual_progress": p.overall_actual_progress or 0.0,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "activity_count": act_count,
            "pending_reviews_count": pending_count
        }
        result.append(ProjectResponse(**p_dict))
    return result

@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.code == req.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project with code '{req.code}' already exists.")
    
    p = Project(
        name=req.name,
        code=req.code,
        description=req.description,
        location=req.location,
        client=req.client,
        contractor=req.contractor,
        baseline_start=req.baseline_start or datetime.datetime.utcnow(),
        baseline_finish=req.baseline_finish or (datetime.datetime.utcnow() + datetime.timedelta(days=180)),
        current_snapshot_date=req.current_snapshot_date or datetime.datetime.utcnow(),
        status=req.status or "ACTIVE"
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return ProjectResponse(
        id=p.id,
        name=p.name,
        code=p.code,
        description=p.description,
        location=p.location,
        client=p.client,
        contractor=p.contractor,
        baseline_start=p.baseline_start,
        baseline_finish=p.baseline_finish,
        current_snapshot_date=p.current_snapshot_date,
        status=p.status,
        overall_planned_progress=0.0,
        overall_actual_progress=0.0,
        created_at=p.created_at,
        updated_at=p.updated_at,
        activity_count=0,
        pending_reviews_count=0
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Recalculate variances
    variance_engine.update_project_variances(db, p)
    act_count = db.query(Activity).filter(Activity.project_id == p.id).count()
    pending_count = db.query(SiteUpdate).filter(
        SiteUpdate.project_id == p.id,
        SiteUpdate.review_status == "PENDING"
    ).count()

    return ProjectResponse(
        id=p.id,
        name=p.name,
        code=p.code,
        description=p.description,
        location=p.location,
        client=p.client,
        contractor=p.contractor,
        baseline_start=p.baseline_start,
        baseline_finish=p.baseline_finish,
        current_snapshot_date=p.current_snapshot_date,
        status=p.status,
        overall_planned_progress=p.overall_planned_progress or 0.0,
        overall_actual_progress=p.overall_actual_progress or 0.0,
        created_at=p.created_at,
        updated_at=p.updated_at,
        activity_count=act_count,
        pending_reviews_count=pending_count
    )

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, req: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if req.name is not None:
        p.name = req.name
    if req.description is not None:
        p.description = req.description
    if req.location is not None:
        p.location = req.location
    if req.client is not None:
        p.client = req.client
    if req.contractor is not None:
        p.contractor = req.contractor
    if req.status is not None:
        p.status = req.status
    if req.current_snapshot_date is not None:
        p.current_snapshot_date = req.current_snapshot_date
        variance_engine.update_project_variances(db, p)

    db.commit()
    db.refresh(p)
    return get_project(project_id, db)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete a project and every dependent record in one transaction."""
    if project_id < 1:
        raise HTTPException(
            status_code=422,
            detail="Project ID must be a positive integer.",
        )

    try:
        with db.begin():
            project = db.get(Project, project_id)
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            activity_ids = [
                activity_id
                for (activity_id,) in db.query(Activity.id)
                .filter(Activity.project_id == project_id)
                .all()
            ]
            site_update_ids = [
                site_update_id
                for (site_update_id,) in db.query(SiteUpdate.id)
                .filter(SiteUpdate.project_id == project_id)
                .all()
            ]

            # Foreign keys use NO ACTION, so remove the deepest dependents first.
            if site_update_ids:
                db.query(ReviewDecision).filter(
                    ReviewDecision.site_update_id.in_(site_update_ids)
                ).delete(synchronize_session=False)
                db.query(ProgressUpdate).filter(
                    ProgressUpdate.site_update_id.in_(site_update_ids)
                ).delete(synchronize_session=False)
                db.query(MatchResult).filter(
                    MatchResult.site_update_id.in_(site_update_ids)
                ).delete(synchronize_session=False)

            if activity_ids:
                db.query(ReviewDecision).filter(
                    ReviewDecision.activity_id.in_(activity_ids)
                ).delete(synchronize_session=False)
                db.query(ProgressUpdate).filter(
                    ProgressUpdate.activity_id.in_(activity_ids)
                ).delete(synchronize_session=False)
                db.query(MatchResult).filter(
                    MatchResult.activity_id.in_(activity_ids)
                ).delete(synchronize_session=False)
                db.query(Recommendation).filter(
                    Recommendation.activity_id.in_(activity_ids)
                ).delete(synchronize_session=False)
                db.query(RiskPrediction).filter(
                    RiskPrediction.activity_id.in_(activity_ids)
                ).delete(synchronize_session=False)

            db.query(SiteUpdate).filter(
                SiteUpdate.project_id == project_id
            ).delete(synchronize_session=False)
            db.query(Report).filter(
                Report.project_id == project_id
            ).delete(synchronize_session=False)
            db.query(Activity).filter(
                Activity.project_id == project_id
            ).delete(synchronize_session=False)
            db.delete(project)

        return {
            "id": project_id,
            "message": "Project deleted successfully",
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to delete project %s", project_id)
        raise HTTPException(
            status_code=500,
            detail="Project deletion failed. Please try again.",
        ) from exc
