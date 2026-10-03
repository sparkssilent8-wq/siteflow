from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.activity import Activity
from backend.services.schedule_service import schedule_service

router = APIRouter(prefix="/api/schedule", tags=["Schedule & WBS"])

@router.post("/upload/{project_id}")
async def upload_schedule_file(
    project_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    contents = await file.read()
    filename = file.filename
    try:
        result = schedule_service.parse_and_import(db, project_id, contents, filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import schedule: {str(e)}")

@router.get("/wbs/{project_id}")
def get_wbs_hierarchy(project_id: int, db: Session = Depends(get_db)):
    activities = db.query(Activity).filter(Activity.project_id == project_id).order_by(Activity.wbs_code.asc()).all()
    
    # Build tree
    tree = []
    level_counts = {"L1": 0, "L2": 0, "L3": 0, "L4": 0, "L5": 0, "L6": 0}
    
    for act in activities:
        lvl = act.wbs_level or "L5"
        if lvl in level_counts:
            level_counts[lvl] += 1
            
        tree.append({
            "id": act.id,
            "activity_code": act.activity_code,
            "activity_name": act.activity_name,
            "wbs_code": act.wbs_code,
            "wbs_level": lvl,
            "discipline": act.discipline,
            "planned_start": act.planned_start,
            "planned_finish": act.planned_finish,
            "planned_duration": act.planned_duration,
            "planned_progress": act.planned_progress,
            "actual_progress": act.actual_progress,
            "progress_variance": act.progress_variance,
            "schedule_variance_days": act.schedule_variance_days,
            "status": act.status,
            "risk_level": act.risk_level
        })

    return {
        "project_id": project_id,
        "total_nodes": len(tree),
        "level_counts": level_counts,
        "nodes": tree
    }
