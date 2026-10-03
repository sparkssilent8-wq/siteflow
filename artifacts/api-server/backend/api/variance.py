from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.schemas.schemas import ProjectVarianceResponse, VarianceActivityItem, DisciplinePerformance
from backend.services.variance_service import variance_engine

router = APIRouter(prefix="/api/variance", tags=["Schedule Variance Engine"])

@router.get("/project/{project_id}", response_model=ProjectVarianceResponse)
def get_project_variance(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Refresh variances
    stats = variance_engine.update_project_variances(db, project)
    activities = db.query(Activity).filter(Activity.project_id == project_id).all()

    # Worst variance activities (sorted by progress_variance ascending)
    sorted_acts = sorted(activities, key=lambda a: a.progress_variance or 0.0)
    worst_acts = []
    for a in sorted_acts[:10]:
        m = variance_engine.calculate_activity_variance(a, project.current_snapshot_date)
        worst_acts.append(VarianceActivityItem(
            activity_id=a.id,
            activity_code=a.activity_code,
            activity_name=a.activity_name,
            discipline=a.discipline,
            wbs_level=a.wbs_level or "L5",
            planned_progress=a.planned_progress or 0.0,
            actual_progress=a.actual_progress or 0.0,
            progress_variance=a.progress_variance or 0.0,
            schedule_variance_days=a.schedule_variance_days or 0.0,
            status=a.status or "NOT_STARTED",
            risk_level=a.risk_level or "LOW",
            earned_duration=m["earned_duration"],
            elapsed_duration=m["elapsed_duration"],
            planned_duration=m["planned_duration"]
        ))

    # Discipline aggregations
    disc_map = {}
    for a in activities:
        d = a.discipline or "General"
        if d not in disc_map:
            disc_map[d] = {"total": 0, "completed": 0, "in_progress": 0, "delayed": 0, "p_sum": 0.0, "a_sum": 0.0}
        disc_map[d]["total"] += 1
        disc_map[d]["p_sum"] += (a.planned_progress or 0.0)
        disc_map[d]["a_sum"] += (a.actual_progress or 0.0)
        if a.status == "COMPLETED":
            disc_map[d]["completed"] += 1
        elif a.status == "DELAYED":
            disc_map[d]["delayed"] += 1
        elif a.status in ["IN_PROGRESS", "AT_RISK"]:
            disc_map[d]["in_progress"] += 1

    disc_list = []
    for d, val in disc_map.items():
        n = val["total"]
        p_avg = round(val["p_sum"] / n, 1)
        a_avg = round(val["a_sum"] / n, 1)
        disc_list.append(DisciplinePerformance(
            discipline=d,
            total_activities=n,
            completed=val["completed"],
            in_progress=val["in_progress"],
            delayed=val["delayed"],
            planned_progress_avg=p_avg,
            actual_progress_avg=a_avg,
            variance=round(a_avg - p_avg, 1)
        ))

    return ProjectVarianceResponse(
        project_id=project.id,
        snapshot_date=project.current_snapshot_date,
        overall_progress_variance=stats.get("overall_progress_variance", 0.0),
        total_schedule_slippage_days=stats.get("total_schedule_slippage_days", 0.0),
        delayed_activities_count=stats.get("delayed_activities_count", 0),
        at_risk_activities_count=stats.get("at_risk_activities_count", 0),
        on_track_activities_count=stats.get("on_track_activities_count", 0),
        completed_activities_count=stats.get("completed_activities_count", 0),
        worst_variance_activities=worst_acts,
        discipline_variances=disc_list
    )
