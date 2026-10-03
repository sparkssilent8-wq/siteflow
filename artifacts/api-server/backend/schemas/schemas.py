from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    location: Optional[str] = None
    client: Optional[str] = None
    contractor: Optional[str] = None
    baseline_start: Optional[datetime] = None
    baseline_finish: Optional[datetime] = None
    current_snapshot_date: Optional[datetime] = None
    status: Optional[str] = "ACTIVE"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    client: Optional[str] = None
    contractor: Optional[str] = None
    current_snapshot_date: Optional[datetime] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    overall_planned_progress: float
    overall_actual_progress: float
    created_at: datetime
    updated_at: datetime
    activity_count: Optional[int] = 0
    pending_reviews_count: Optional[int] = 0

# Activity Schemas
class ActivityBase(BaseModel):
    activity_code: str
    activity_name: str
    wbs_code: Optional[str] = None
    wbs_level: Optional[str] = "L5"
    discipline: Optional[str] = "General"
    planned_start: Optional[datetime] = None
    planned_finish: Optional[datetime] = None
    planned_duration: Optional[int] = 1
    predecessor: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    planned_progress: Optional[float] = 0.0
    actual_progress: Optional[float] = 0.0
    status: Optional[str] = "NOT_STARTED"
    risk_level: Optional[str] = "LOW"
    contractor_id: Optional[str] = None
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    project_id: int

class ActivityUpdate(BaseModel):
    actual_progress: Optional[float] = None
    status: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None

class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    progress_variance: float
    schedule_variance_days: float
    created_at: datetime
    updated_at: datetime

# Progress Update Schemas
class ProgressUpdateCreate(BaseModel):
    activity_id: Optional[int] = None
    progress_percentage: float
    status: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    source: Optional[str] = "SITE_UPDATE"
    confidence: Optional[float] = 1.0
    remarks: Optional[str] = None
    site_update_id: Optional[int] = None
    reviewer_name: Optional[str] = "Site Supervisor"

class ProgressUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_id: int
    progress_percentage: float
    previous_percentage: float
    status: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None
    source: str
    confidence: float
    remarks: Optional[str] = None
    site_update_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    created_at: datetime

# Site Update & Matching Schemas
class SiteUpdateCreate(BaseModel):
    project_id: int
    raw_text: str
    progress_pct: Optional[float] = None
    status: Optional[str] = None
    date: Optional[datetime] = None
    remarks: Optional[str] = None
    location: Optional[str] = None
    contractor: Optional[str] = None
    photo_url: Optional[str] = None
    report_file_url: Optional[str] = None
    source: Optional[str] = "MANUAL"
    event_type: Optional[str] = None
    voice_transcript: Optional[str] = None
    extracted_activity: Optional[str] = None
    extracted_discipline: Optional[str] = None
    actual_event_time: Optional[datetime] = None
    extraction_confidence: Optional[float] = None

class MatchResultItem(BaseModel):
    activity_id: int
    activity_code: str
    activity_name: str
    discipline: str
    wbs_level: str
    confidence_score: float
    match_method: str
    score_breakdown: Optional[Dict[str, Any]] = None
    matched_keywords: Optional[List[str]] = []
    requires_review: bool
    current_progress: float

class MatchingRequest(BaseModel):
    project_id: int
    raw_text: str
    discipline_hint: Optional[str] = None
    top_k: Optional[int] = 5

class MatchingResponse(BaseModel):
    top_match: Optional[MatchResultItem] = None
    matches: List[MatchResultItem]
    requires_review: bool
    overall_confidence: float
    explanation: str

class SiteUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    raw_text: str
    progress_pct: Optional[float] = None
    status: Optional[str] = None
    date: datetime
    remarks: Optional[str] = None
    location: Optional[str] = None
    contractor: Optional[str] = None
    photo_url: Optional[str] = None
    matched_activity_id: Optional[int] = None
    match_confidence: float
    match_method: str
    review_status: str
    source: Optional[str] = "MANUAL"
    event_type: Optional[str] = None
    voice_transcript: Optional[str] = None
    extracted_activity: Optional[str] = None
    extracted_discipline: Optional[str] = None
    actual_event_time: Optional[datetime] = None
    extraction_confidence: Optional[float] = None
    created_at: datetime
    matched_activity: Optional[ActivityResponse] = None
    top_matches: Optional[List[MatchResultItem]] = None

# Review Schemas
class ReviewActionRequest(BaseModel):
    site_update_id: int
    activity_id: Optional[int] = None
    decision: str # APPROVE or REJECT
    adjusted_progress: Optional[float] = None
    reviewer_name: Optional[str] = "Project Manager"
    review_notes: Optional[str] = None

class ReviewDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_update_id: int
    activity_id: Optional[int] = None
    decision: str
    reviewer_name: str
    review_notes: Optional[str] = None
    created_at: datetime

# ML Risk & Simulation Schemas
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
    risk_category: str # LOW, MEDIUM, HIGH, CRITICAL
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

# Analytics & Variance Schemas
class DisciplinePerformance(BaseModel):
    discipline: str
    total_activities: int
    completed: int
    in_progress: int
    delayed: int
    planned_progress_avg: float
    actual_progress_avg: float
    variance: float

class VarianceActivityItem(BaseModel):
    activity_id: int
    activity_code: str
    activity_name: str
    discipline: str
    wbs_level: str
    planned_progress: float
    actual_progress: float
    progress_variance: float
    schedule_variance_days: float
    status: str
    risk_level: str
    earned_duration: float
    elapsed_duration: float
    planned_duration: int

class ProjectVarianceResponse(BaseModel):
    project_id: int
    snapshot_date: datetime
    overall_progress_variance: float
    total_schedule_slippage_days: float
    delayed_activities_count: int
    at_risk_activities_count: int
    on_track_activities_count: int
    completed_activities_count: int
    worst_variance_activities: List[VarianceActivityItem]
    discipline_variances: List[DisciplinePerformance]

class SCurvePoint(BaseModel):
    date: str
    planned_pct: float
    actual_pct: Optional[float] = None

class ProjectAnalyticsResponse(BaseModel):
    project_id: int
    project_name: str
    overall_planned_progress: float
    overall_actual_progress: float
    status: str
    total_activities: int
    completed_activities: int
    in_progress_activities: int
    delayed_activities: int
    high_risk_activities: int
    pending_reviews: int
    disciplines: List[DisciplinePerformance]
    s_curve_data: List[SCurvePoint]
    status_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
