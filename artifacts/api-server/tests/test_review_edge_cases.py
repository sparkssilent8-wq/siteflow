import datetime
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import SessionLocal
from backend.models.site_update import SiteUpdate


client = TestClient(app)


def test_unmatched_review_cannot_be_approved_and_can_be_rejected():
    db = SessionLocal()
    update = SiteUpdate(
        project_id=1,
        raw_text="Unmatched field note for a location not present in the schedule.",
        progress_pct=12.0,
        status="IN_PROGRESS",
        date=datetime.datetime.utcnow(),
        review_status="PENDING",
        matched_activity_id=None,
        match_confidence=0.0,
        match_method="UNMATCHED",
    )
    db.add(update)
    db.commit()
    db.refresh(update)
    update_id = update.id
    db.close()

    queue = client.get("/api/review/project/1")
    assert queue.status_code == 200
    item = next(item for item in queue.json()["items"] if item["site_update_id"] == update_id)
    assert item["matched_activity"] is None

    approval = client.post("/api/review/approve", json={
        "site_update_id": update_id,
        "decision": "APPROVED",
        "adjusted_progress": 12.0,
    })
    assert approval.status_code == 400
    assert "target activity" in approval.json()["detail"].lower()

    rejection = client.post("/api/review/reject", json={
        "site_update_id": update_id,
        "decision": "REJECTED",
        "review_notes": "No schedule activity matched.",
    })
    assert rejection.status_code == 200
    assert rejection.json()["activity_id"] is None