import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_projects():
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1
    assert any(p["code"] == "EW-GAS-2026" for p in projects)

def test_get_project_detail():
    res = client.get("/api/projects/1")
    assert res.status_code == 200
    p = res.json()
    assert p["id"] == 1
    assert "East-West" in p["name"]

def test_list_activities_and_l5_l6():
    res = client.get("/api/activities/project/1")
    assert res.status_code == 200
    acts = res.json()
    assert len(acts) >= 10

    # Test L5/L6 filter
    res_l5 = client.get("/api/activities/project/1?l5_l6_only=true")
    assert res_l5.status_code == 200
    l5_acts = res_l5.json()
    assert all(a["wbs_level"] in ["L5", "L6"] for a in l5_acts)

def test_matching_endpoint():
    payload = {
        "project_id": 1,
        "raw_text": "Erection of 24 inch line completed up to 60% with 14 welders on site",
        "top_k": 3
    }
    res = client.post("/api/matching", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["top_match"] is not None
    assert "PIP-L6-024" in data["top_match"]["activity_code"]
    assert data["top_match"]["confidence_score"] > 0.60

def test_review_queue_and_approval():
    # Submit fresh update to ensure item exists
    sub_res = client.post("/api/site-updates", json={
        "project_id": 1,
        "raw_text": "Tie-in golden weld fitup completed up to 65% with 12 welders",
        "progress_pct": 65.0,
        "status": "IN_PROGRESS",
        "remarks": "Radiography pass verification"
    })
    assert sub_res.status_code == 200
    su_data = sub_res.json()
    su_id = su_data["id"]
    target_act_id = su_data["matched_activity_id"]

    # Fetch pending review
    res_queue = client.get("/api/review/project/1")
    assert res_queue.status_code == 200
    items = res_queue.json()["items"]
    assert len(items) >= 1

    # Approve update
    approve_payload = {
        "site_update_id": su_id,
        "activity_id": target_act_id,
        "decision": "APPROVED",
        "adjusted_progress": 65.0,
        "reviewer_name": "Senior Inspection Lead",
        "review_notes": "Radiography and fit-up verified on site."
    }
    res_app = client.post("/api/review/approve", json=approve_payload)
    assert res_app.status_code == 200
    assert res_app.json()["decision"] == "APPROVED"

    # Verify Activity progress updated
    res_act = client.get(f"/api/activities/{target_act_id}")
    assert res_act.status_code == 200
    act_data = res_act.json()
    assert act_data["activity"]["actual_progress"] == 65.0
    assert len(act_data["progress_history"]) >= 1

def test_variance_and_analytics():
    res_var = client.get("/api/variance/project/1")
    assert res_var.status_code == 200
    var_data = res_var.json()
    assert "worst_variance_activities" in var_data
    assert len(var_data["discipline_variances"]) >= 4

    res_ana = client.get("/api/analytics/project/1")
    assert res_ana.status_code == 200
    ana_data = res_ana.json()
    assert "s_curve_data" in ana_data
    assert len(ana_data["s_curve_data"]) >= 10
