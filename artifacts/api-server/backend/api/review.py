import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.models.site_update import SiteUpdate
from backend.models.review_decision import ReviewDecision
from backend.models.progress_update import ProgressUpdate
from backend.schemas.schemas import ReviewActionRequest, ReviewDecisionResponse
from backend.services.variance_service import variance_engine
from backend.services.ml_client import ml_client, MLServiceError

router = APIRouter(prefix="/api/review", tags=["Review Queue & Verification"])

@router.get("/project/{project_id}")
def get_pending_review_queue(project_id: int, db: Session = Depends(get_db)):
    pending = db.query(SiteUpdate).filter(
        SiteUpdate.project_id == project_id,
        SiteUpdate.review_status == "PENDING"
    ).order_by(SiteUpdate.created_at.desc()).all()

    queue_items = []
    for su in pending:
        matched_act = db.query(Activity).filter(Activity.id == su.matched_activity_id).first() if su.matched_activity_id else None
        
        queue_items.append({
            "site_update_id": su.id,
            "project_id": su.project_id,
            "raw_text": su.raw_text,
            "proposed_progress": su.progress_pct,
            "submitted_date": su.date,
            "location": su.location,
            "contractor": su.contractor,
            "photo_url": su.photo_url,
            "report_file_url": su.report_file_url,
            "source": su.source,
            "event_type": su.event_type,
            "voice_transcript": su.voice_transcript,
            "extracted_activity": su.extracted_activity,
            "extracted_discipline": su.extracted_discipline,
            "actual_event_time": su.actual_event_time,
            "extraction_confidence": su.extraction_confidence,
            "match_confidence": su.match_confidence,
            "match_method": su.match_method,
            "matched_activity": {
                "id": matched_act.id,
                "activity_code": matched_act.activity_code,
                "activity_name": matched_act.activity_name,
                "discipline": matched_act.discipline,
                "wbs_level": matched_act.wbs_level,
                "current_progress": matched_act.actual_progress or 0.0,
                "planned_progress": matched_act.planned_progress or 0.0,
                "status": matched_act.status,
                "risk_level": matched_act.risk_level
            } if matched_act else None
        })

    return {
        "project_id": project_id,
        "pending_count": len(queue_items),
        "items": queue_items
    }

@router.post("/approve", response_model=ReviewDecisionResponse)
async def approve_site_update(req: ReviewActionRequest, db: Session = Depends(get_db)):
    su = db.query(SiteUpdate).filter(SiteUpdate.id == req.site_update_id).first()
    if not su:
        raise HTTPException(status_code=404, detail="Site update not found")

    act_id = req.activity_id or su.matched_activity_id
    if not act_id:
        raise HTTPException(status_code=400, detail="Cannot approve without target activity.")

    act = db.query(Activity).filter(Activity.id == act_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Target activity not found")

    new_prog = req.adjusted_progress if req.adjusted_progress is not None else (su.progress_pct if su.progress_pct is not None else (act.actual_progress or 0.0))
    prev_prog = act.actual_progress or 0.0

    # 1. Update SiteUpdate review status
    su.review_status = "APPROVED"
    su.matched_activity_id = act_id

    # 2. Record Review Decision
    decision = ReviewDecision(
        site_update_id=su.id,
        activity_id=act_id,
        decision="APPROVED",
        previous_status="PENDING",
        reviewer_name=req.reviewer_name or "Project Manager",
        review_notes=req.review_notes or f"Approved progress update to {new_prog}%"
    )
    db.add(decision)

    # 3. Resolve actual event timestamps. Time Agent captures the field event
    # time; approval time must never overwrite it.
    event_time = su.actual_event_time or su.date or datetime.datetime.utcnow()
    actual_start = act.actual_start
    actual_finish = act.actual_finish
    if su.event_type == "ACTUAL_START":
        actual_start = actual_start or event_time
        new_prog = act.actual_progress if su.progress_pct is None else new_prog
    elif su.event_type == "ACTUAL_END":
        actual_start = actual_start or event_time
        actual_finish = event_time
        new_prog = 100.0

    # 3. Create Immutable Progress Update
    pu = ProgressUpdate(
        activity_id=act_id,
        progress_percentage=new_prog,
        previous_percentage=prev_prog,
        status="IN_PROGRESS" if new_prog < 100 else "COMPLETED",
        actual_start=actual_start,
        actual_finish=actual_finish if new_prog >= 100.0 else None,
        source="TIME_AGENT_VERIFIED" if su.source == "TIME_AGENT_VOICE" else "VERIFIED_SITE_UPDATE",
        confidence=su.match_confidence,
        remarks=f"{su.raw_text} (Verified by {req.reviewer_name})",
        site_update_id=su.id,
        reviewer_name=req.reviewer_name
    )
    db.add(pu)

    # 4. Update Activity Actual Progress
    act.actual_progress = new_prog
    if actual_start and not act.actual_start:
        act.actual_start = actual_start
    if new_prog >= 100.0:
        act.status = "COMPLETED"
        act.actual_finish = actual_finish or event_time
    elif new_prog > 0 or su.event_type == "ACTUAL_START":
        act.status = "IN_PROGRESS"

    db.commit()

    # 5. Recalculate Project Variance
    project = db.query(Project).filter(Project.id == act.project_id).first()
    if project:
        variance_engine.update_project_variances(db, project)

    # 6. Verified update -> best-effort ML prediction.
    # The approval itself must remain successful if ML is offline.
    try:
        now = datetime.datetime.utcnow()
        days_elapsed = max(0.0, (now - act.planned_start).total_seconds() / 86400.0) if act.planned_start else 0.0
        planned_duration = float(act.planned_duration or 1)
        days_elapsed = min(days_elapsed, planned_duration) if planned_duration > 0 else days_elapsed
        current_progress = float(act.actual_progress or 0.0)
        previous_progress = float(prev_prog)
        velocity_recent = max(0.1, current_progress - previous_progress)

        prediction_payload = {
            "task_id": str(act.id),
            "task_type": act.discipline or "General",
            "contractor_id": act.contractor_id or "CONT-01",
            "planned_duration_days": planned_duration,
            "days_elapsed": days_elapsed,
            "current_progress_pct": current_progress,
            "planned_progress_pct_at_this_point": float(act.planned_progress or current_progress),
            "planned_days_remaining_at_snapshot": max(1.0, planned_duration - days_elapsed),
            "progress_velocity_recent": velocity_recent,
            "progress_velocity_early": max(0.1, velocity_recent),
            "planned_manpower": 15.0,
            "planned_equipment_score": 85.0,
            "planned_material_score": 90.0,
            "manpower_recent_avg": 15.0,
            "equipment_availability_recent_avg": 85.0,
            "material_availability_recent_avg": 90.0,
            "manpower_early_avg": 15.0,
            "contractor_past_projects": 12,
            "contractor_historical_delay_rate": 0.18,
        }
        result = await ml_client.predict(prediction_payload)
        from backend.api.ml_proxy import _save_prediction
        _save_prediction(result, db)
    except MLServiceError:
        # Do not fail a verified field update because the ML service is unavailable.
        pass

    db.refresh(decision)
    return decision

@router.post("/reject", response_model=ReviewDecisionResponse)
def reject_site_update(req: ReviewActionRequest, db: Session = Depends(get_db)):
    su = db.query(SiteUpdate).filter(SiteUpdate.id == req.site_update_id).first()
    if not su:
        raise HTTPException(status_code=404, detail="Site update not found")

    act_id = req.activity_id or su.matched_activity_id

    su.review_status = "REJECTED"

    decision = ReviewDecision(
        site_update_id=su.id,
        activity_id=act_id,
        decision="REJECTED",
        previous_status="PENDING",
        reviewer_name=req.reviewer_name or "Project Manager",
        review_notes=req.review_notes or "Rejected: Data mismatch or duplicate update."
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision
