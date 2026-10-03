import pytest
from ml.models.delay_risk_model import DelayRiskModelService

ml_svc = DelayRiskModelService()

def test_ml_prediction():
    input_data = {
        "task_id": "PIP-L6-024",
        "task_type": "Piping",
        "contractor_id": "Larsen & Petro Engineering JV",
        "contractor_past_projects": 15,
        "contractor_historical_delay_rate": 0.22,
        "planned_duration_days": 40.0,
        "planned_manpower": 18.0,
        "planned_equipment_score": 90.0,
        "planned_material_score": 90.0,
        "days_elapsed": 25.0,
        "current_progress_pct": 45.0,
        "planned_progress_pct_at_this_point": 65.0,
        "manpower_recent_avg": 14.0,
        "equipment_availability_recent_avg": 75.0,
        "material_availability_recent_avg": 65.0,
        "manpower_early_avg": 18.0,
        "progress_velocity_recent": 1.1,
        "progress_velocity_early": 1.9,
        "planned_days_remaining_at_snapshot": 15.0
    }

    res = ml_svc.predict_risk(input_data)
    assert res["task_id"] == "PIP-L6-024"
    assert res["predicted_remaining_days"] > 0
    assert res["risk_category"] in ["MEDIUM", "HIGH", "CRITICAL"]
    assert "factor_contributions" in res
    assert len(res["factor_contributions"]) >= 4

def test_what_if_simulation():
    input_data = {
        "task_id": "PIP-L6-024",
        "planned_duration_days": 40.0,
        "days_elapsed": 25.0,
        "current_progress_pct": 45.0,
        "planned_progress_pct_at_this_point": 65.0,
        "planned_manpower": 18.0,
        "manpower_recent_avg": 12.0,
        "material_availability_recent_avg": 60.0,
        "progress_velocity_recent": 1.0,
        "progress_velocity_early": 1.8
    }

    # Simulate +25% manpower and +20% material
    sim_res = ml_svc.simulate(input_data, manpower_delta_pct=25.0, equip_delta_pct=10.0, mat_delta_pct=20.0)
    assert sim_res["simulated_risk_score"] <= sim_res["baseline_risk_score"]
    assert sim_res["delay_days_saved"] >= 0.0

def test_recommendations():
    predict_dummy = {
        "risk_category": "HIGH",
        "factor_contributions": {
            "Material Availability Bottleneck": 24.5,
            "Manpower Deficit": 19.0,
            "Schedule Variance Gap": 28.0
        },
        "anomaly_reasons": ["Critical material bottleneck: Availability rated at 60%"]
    }
    recs = ml_svc.recommend(predict_dummy, activity_name="Erect Line 24\"-XX", discipline="Piping")
    assert len(recs) >= 2
    assert any("Material" in r["title"] for r in recs)
    assert any("Crew" in r["title"] or "Manpower" in r["title"] for r in recs)
