import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.models.site_update import SiteUpdate
from backend.models.match_result import MatchResult
from backend.models.progress_update import ProgressUpdate
from backend.schemas.schemas import SiteUpdateCreate, SiteUpdateResponse, MatchResultItem, ActivityResponse
from backend.services.matching_service import matching_service
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/site-updates", tags=["Site Updates Capture"])

@router.post("", response_model=SiteUpdateResponse)
def submit_site_update(req: SiteUpdateCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Run matching service
    match_res = matching_service.match_update_to_activities(
        db=db,
        project_id=req.project_id,
        raw_text=req.raw_text,
        top_k=5
    )

    top_m = match_res["top_match"]
    matched_id = top_m["activity_id"] if top_m else None
    confidence = top_m["confidence_score"] if top_m else 0.0

    # Site updates always enter review queue for human-in-the-loop verification
    review_status = "PENDING"

    # Create SiteUpdate entity
    site_up = SiteUpdate(
        project_id=req.project_id,
        raw_text=req.raw_text,
        progress_pct=req.progress_pct,
        status=req.status or "IN_PROGRESS",
        date=req.date or datetime.datetime.now(datetime.timezone.utc),
        remarks=req.remarks,
        location=req.location,
        contractor=req.contractor or project.contractor,
        photo_url=req.photo_url,
        report_file_url=req.report_file_url,
        matched_activity_id=matched_id,
        match_confidence=confidence,
        match_method="HYBRID_TFIDF_DOMAIN",
        review_status=review_status,
        source=req.source or "MANUAL",
        event_type=req.event_type,
        voice_transcript=req.voice_transcript,
        extracted_activity=req.extracted_activity,
        extracted_discipline=req.extracted_discipline,
        actual_event_time=req.actual_event_time,
        extraction_confidence=req.extraction_confidence,
    )
    db.add(site_up)
    db.commit()
    db.refresh(site_up)

    # Record match results
    match_result_items = []
    for rank, m in enumerate(match_res["matches"], 1):
        mr = MatchResult(
            site_update_id=site_up.id,
            activity_id=m["activity_id"],
            confidence_score=m["confidence_score"],
            match_method=m["match_method"],
            score_breakdown=json.dumps(m["score_breakdown"]),
            top_keywords=json.dumps(m["matched_keywords"]),
            requires_review=m["requires_review"],
            rank=rank
        )
        db.add(mr)
        match_result_items.append(MatchResultItem(**m))

    db.commit()
    db.refresh(site_up)

    res = SiteUpdateResponse.model_validate(site_up)
    res.top_matches = match_result_items
    return res

@router.get("/project/{project_id}", response_model=List[SiteUpdateResponse])
def list_site_updates(
    project_id: int, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    q = db.query(SiteUpdate).filter(SiteUpdate.project_id == project_id)
    if status and status != "ALL":
        q = q.filter(SiteUpdate.review_status == status)
    
    updates = q.order_by(SiteUpdate.created_at.desc()).all()
    results = []
    for u in updates:
        r = SiteUpdateResponse.model_validate(u)
        m_rows = db.query(MatchResult).filter(MatchResult.site_update_id == u.id).order_by(MatchResult.rank.asc()).all()
        r.top_matches = []
        for mr in m_rows:
            act = db.query(Activity).filter(Activity.id == mr.activity_id).first()
            if act:
                r.top_matches.append(MatchResultItem(
                    activity_id=act.id,
                    activity_code=act.activity_code,
                    activity_name=act.activity_name,
                    discipline=act.discipline,
                    wbs_level=act.wbs_level or "L5",
                    confidence_score=mr.confidence_score,
                    match_method=mr.match_method,
                    score_breakdown=json.loads(mr.score_breakdown) if mr.score_breakdown else {},
                    matched_keywords=json.loads(mr.top_keywords) if mr.top_keywords else [],
                    requires_review=mr.requires_review,
                    current_progress=act.actual_progress or 0.0
                ))
        results.append(r)
    return results
