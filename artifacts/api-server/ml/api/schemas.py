from typing import Dict, List, Optional
from pydantic import BaseModel


class MLPredictRequest(BaseModel):
    task_id: str
    task_type: Optional[str] = "General"
    contractor_id: Optional[str] = "CONT-01"
    contractor_past_projects: Optional[int] = 12
    contractor_historical_delay_rate: Optional[float] = 0.18
    planned_duration_days: float = 30.0
    planned_manpower: Optional[float] = 15.0
    planned_equipment_score: Optional[float] = 85.0
    planned_material_score: Optional[float] = 90.0
    days_elapsed: float = 12.0
    current_progress_pct: float = 40.0
    planned_progress_pct_at_this_point: float = 50.0
    manpower_recent_avg: Optional[float] = 13.0
    equipment_availability_recent_avg: Optional[float] = 78.0
    material_availability_recent_avg: Optional[float] = 82.0
    manpower_early_avg: Optional[float] = 15.0
    progress_velocity_recent: Optional[float] = 1.2
    progress_velocity_early: Optional[float] = 1.8
    planned_days_remaining_at_snapshot: Optional[float] = 18.0


class MLPredictResponse(BaseModel):
    task_id: str
    predicted_remaining_days: float
    prediction_interval_80pct: str
    expected_completion_in_days: float
    delay_probability: float
    risk_category: str
    risk_score_0_100: float
    is_anomalous: bool
    anomaly_reasons: List[str]
    explanation: str
    factor_contributions: Dict[str, float]
    model_confidence_note: str


class MLSimulateRequest(BaseModel):
    base_input: MLPredictRequest
    manpower_delta_pct: float = 0.0
    equipment_availability_delta_pct: float = 0.0
    material_availability_delta_pct: float = 0.0


class MLSimulateResponse(BaseModel):
    baseline_risk_score: float
    baseline_delay_probability: float
    baseline_predicted_remaining_days: float
    simulated_risk_score: float
    simulated_delay_probability: float
    simulated_predicted_remaining_days: float
    risk_category_before: str
    risk_category_after: str
    delay_days_saved: float
    simulation_summary: str


class MLAnomalyResponse(BaseModel):
    task_id: str
    is_anomalous: bool
    anomaly_reasons: List[str]


class RecommendationItem(BaseModel):
    title: str
    priority: str
    rationale: str
    impact: str
    action_steps: List[str]


class MLRecommendRequest(BaseModel):
    predict_result: MLPredictResponse
    activity_name: Optional[str] = ""
    discipline: Optional[str] = ""


class MLRecommendResponse(BaseModel):
    recommendations: List[RecommendationItem]
