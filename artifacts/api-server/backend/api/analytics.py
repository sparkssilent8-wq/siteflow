import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.models.site_update import SiteUpdate
from backend.schemas.schemas import ProjectAnalyticsResponse, SCurvePoint, DisciplinePerformance
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/analytics", tags=["Project Analytics & Intelligence"])

@router.get("/project/{project_id}", response_model=ProjectAnalyticsResponse)
def get_project_analytics(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    variance_engine.update_project_variances(db, project)
    activities = db.query(Activity).filter(Activity.project_id == project_id).all()
    pending_count = db.query(SiteUpdate).filter(
        SiteUpdate.project_id == project_id,
        SiteUpdate.review_status == "PENDING"
    ).count()

    total_acts = len(activities)
    completed_count = 0
    in_progress_count = 0
    delayed_count = 0
    high_risk_count = 0

    status_dist = {"COMPLETED": 0, "IN_PROGRESS": 0, "AT_RISK": 0, "DELAYED": 0, "NOT_STARTED": 0}
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    disc_map = {}

    for a in activities:
        st = a.status or "NOT_STARTED"
        rk = a.risk_level or "LOW"
        status_dist[st] = status_dist.get(st, 0) + 1
        risk_dist[rk] = risk_dist.get(rk, 0) + 1

        if st == "COMPLETED":
            completed_count += 1
        elif st == "DELAYED":
            delayed_count += 1
        elif st in ["IN_PROGRESS", "AT_RISK"]:
            in_progress_count += 1

        if rk in ["HIGH", "CRITICAL"]:
            high_risk_count += 1

        # Discipline breakdown
        d = a.discipline or "General"
        if d not in disc_map:
            disc_map[d] = {"total": 0, "completed": 0, "in_progress": 0, "delayed": 0, "p_sum": 0.0, "a_sum": 0.0}
        disc_map[d]["total"] += 1
        disc_map[d]["p_sum"] += (a.planned_progress or 0.0)
        disc_map[d]["a_sum"] += (a.actual_progress or 0.0)
        if st == "COMPLETED":
            disc_map[d]["completed"] += 1
        elif st == "DELAYED":
            disc_map[d]["delayed"] += 1
        elif st in ["IN_PROGRESS", "AT_RISK"]:
            disc_map[d]["in_progress"] += 1

    disc_list = []
    for d, val in disc_map.items():
        n = max(1, val["total"])
        p_avg = round(val["p_sum"] / n, 1)
        a_avg = round(val["a_sum"] / n, 1)
        disc_list.append(DisciplinePerformance(
            discipline=d,
            total_activities=val["total"],
            completed=val["completed"],
            in_progress=val["in_progress"],
            delayed=val["delayed"],
            planned_progress_avg=p_avg,
            actual_progress_avg=a_avg,
            variance=round(a_avg - p_avg, 1)
        ))

    # Generate S-Curve points across project timeline (e.g. 10 checkpoints)
    s_curve = []
    base_start = project.baseline_start or (datetime.datetime.utcnow() - datetime.timedelta(days=60))
    base_finish = project.baseline_finish or (datetime.datetime.utcnow() + datetime.timedelta(days=120))
    total_days = max(1, (base_finish - base_start).days)
    curr_snap = project.current_snapshot_date or datetime.datetime.utcnow()

    for i in range(11):
        pt_date = base_start + datetime.timedelta(days=int((total_days / 10.0) * i))
        date_str = pt_date.strftime("%b %d")
        
        # Planned S-Curve Sigmoid approximation
        t = i / 10.0
        p_pct = round(100.0 / (1.0 + 2.71828 ** (-6.0 * (t - 0.5))), 1)
        p_pct = min(100.0, max(0.0, p_pct))

        # Actual curve up to snapshot date
        if pt_date <= curr_snap:
            # Scale actual linearly to project.overall_actual_progress
            snap_ratio = max(0.01, min(1.0, (curr_snap - base_start).days / max(1, (base_finish - base_start).days)))
            curr_pct = project.overall_actual_progress or 0.0
            act_pct = round(min(curr_pct, curr_pct * (i / (10.0 * snap_ratio))), 1)
        else:
            act_pct = None

        s_curve.append(SCurvePoint(
            date=date_str,
            planned_pct=p_pct,
            actual_pct=act_pct
        ))

    return ProjectAnalyticsResponse(
        project_id=project.id,
        project_name=project.name,
        overall_planned_progress=project.overall_planned_progress or 0.0,
        overall_actual_progress=project.overall_actual_progress or 0.0,
        status=project.status or "ACTIVE",
        total_activities=total_acts,
        completed_activities=completed_count,
        in_progress_activities=in_progress_count,
        delayed_activities=delayed_count,
        high_risk_activities=high_risk_count,
        pending_reviews=pending_count,
        disciplines=disc_list,
        s_curve_data=s_curve,
        status_distribution=status_dist,
        risk_distribution=risk_dist
    )
