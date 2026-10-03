import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_sih_end_to_end_scenario():
    # 1. Inspect Project
    res_proj = client.get("/api/projects/1")
    assert res_proj.status_code == 200
    assert res_proj.json()["code"] == "EW-GAS-2026"

    # 2. Inspect Target L6 Activity (PIP-L6-024)
    res_acts = client.get("/api/activities/project/1?search=PIP-L6-024")
    assert res_acts.status_code == 200
    acts = res_acts.json()
    assert len(acts) == 1
    target_act = acts[0]
    act_id = target_act["id"]
    assert target_act["activity_code"] == "PIP-L6-024"

    # 3. Submit Natural Language Site Update
    update_payload = {
        "project_id": 1,
        "raw_text": "Erection of 24 inch line completed up to 60% with 14 welders on site",
        "progress_pct": 60.0,
        "status": "IN_PROGRESS",
        "remarks": "Completed golden weld tie-in joint #04. NDT clearance passed.",
        "location": "Sector 4 Compressor Station Header Point B",
        "photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80"
    }
    res_sub = client.post("/api/site-updates", json=update_payload)
    assert res_sub.status_code == 200
    site_up = res_sub.json()
    assert site_up["matched_activity_id"] == act_id
    assert site_up["match_confidence"] > 0.65
    assert site_up["review_status"] == "PENDING"
    site_up_id = site_up["id"]

    # 4. Human-In-The-Loop Review: Approve the update
    approve_payload = {
        "site_update_id": site_up_id,
        "activity_id": act_id,
        "decision": "APPROVED",
        "adjusted_progress": 60.0,
        "reviewer_name": "SIH Judge Reviewer",
        "review_notes": "Verified against site welding log and tie-in photo evidence."
    }
    res_app = client.post("/api/review/approve", json=approve_payload)
    assert res_app.status_code == 200
    assert res_app.json()["decision"] == "APPROVED"

    # 5. Verify Activity actual progress is updated to 60% and variance recalculated
    res_act_updated = client.get(f"/api/activities/{act_id}")
    assert res_act_updated.status_code == 200
    act_info = res_act_updated.json()["activity"]
    assert act_info["actual_progress"] == 60.0

    # 6. Run AI Risk Snapshot on this activity
    ml_payload = {
        "task_id": str(act_id),
        "task_type": "Piping",
        "contractor_id": "Larsen & Petro Engineering JV",
        "planned_duration_days": float(act_info["planned_duration"]),
        "days_elapsed": 25.0,
        "current_progress_pct": 60.0,
        "planned_progress_pct_at_this_point": float(act_info["planned_progress"]),
        "manpower_recent_avg": 14.0,
        "planned_manpower": 18.0,
        "equipment_availability_recent_avg": 80.0,
        "material_availability_recent_avg": 70.0,
        "progress_velocity_recent": 1.4,
        "progress_velocity_early": 1.8
    }
    res_ml = client.post("/api/ml/predict", json=ml_payload)
    assert res_ml.status_code == 200
    ml_res = res_ml.json()
    assert ml_res["predicted_remaining_days"] > 0
    assert "factor_contributions" in ml_res
    assert ml_res["risk_category"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    # 7. Run Simulation & Prescriptive Actions
    res_sim = client.post("/api/ml/simulate", json={
        "base_input": ml_payload,
        "manpower_delta_pct": 20.0,
        "equipment_availability_delta_pct": 10.0,
        "material_availability_delta_pct": 15.0
    })
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["simulated_risk_score"] <= sim_data["baseline_risk_score"]

    res_rec = client.post("/api/ml/recommend", json={
        "predict_result": ml_res,
        "activity_name": act_info["activity_name"],
        "discipline": act_info["discipline"]
    })
    assert res_rec.status_code == 200
    assert len(res_rec.json()["recommendations"]) >= 1
    print("\n>>> End-to-End SIH Evaluation Scenario PASSED perfectly! <<<")
