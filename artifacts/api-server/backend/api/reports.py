from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import json
import os
import uuid
from pathlib import Path
from backend.database.database import get_db
from backend.models.project import Project
from backend.models.report import Report
from backend.services.report_service import report_service

router = APIRouter(prefix="/api/reports", tags=["Document & DPR Intelligence"])
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
UPLOAD_ROOT = Path(UPLOAD_DIR).resolve()

@router.post("/upload")
async def upload_dpr_report(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    original_filename = file.filename or ""
    filename = Path(original_filename.replace("\\", "/")).name
    extension = Path(filename).suffix.lower()
    if not filename or filename in {".", ".."} or extension not in {".pdf", ".txt"}:
        raise HTTPException(status_code=400, detail="Only PDF and TXT reports are supported.")

    # Keep the original display name but write to a unique, normalized path
    # inside the upload root. Never use client-supplied path segments directly.
    stored_filename = f"{uuid.uuid4().hex}_{filename}"
    save_path = (UPLOAD_ROOT / stored_filename).resolve()
    try:
        save_path.relative_to(UPLOAD_ROOT)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid report filename.") from exc

    file_bytes = await file.read()
    with save_path.open("wb") as f:
        f.write(file_bytes)

    if extension == ".pdf":
        text = report_service.extract_text_from_pdf(file_bytes)
        file_type = "PDF"
    else:
        text = file_bytes.decode("utf-8", errors="ignore")
        file_type = "TXT"

    parsed = report_service.parse_dpr_text(text)

    rep = Report(
        project_id=project_id,
        filename=filename,
        file_path=save_path,
        file_type=file_type,
        extracted_text=text,
        parsed_entities=json.dumps(parsed),
        status="PROCESSED"
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    return {
        "report_id": rep.id,
        "filename": filename,
        "parsed_metadata": {
            "date": parsed["report_date"],
            "contractor": parsed["contractor"],
            "weather": parsed["weather"],
            "extracted_items_count": len(parsed["extracted_items"])
        },
        "extracted_items": parsed["extracted_items"]
    }

@router.get("/project/{project_id}")
def list_project_reports(project_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.project_id == project_id).order_by(Report.created_at.desc()).all()
    res = []
    for r in reports:
        parsed = json.loads(r.parsed_entities) if r.parsed_entities else {}
        res.append({
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "status": r.status,
            "created_at": r.created_at,
            "parsed_metadata": {
                "date": parsed.get("report_date"),
                "contractor": parsed.get("contractor"),
                "weather": parsed.get("weather"),
                "extracted_items_count": len(parsed.get("extracted_items", []))
            }
        })
    return res
