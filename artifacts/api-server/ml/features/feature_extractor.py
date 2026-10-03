import numpy as np
from typing import Dict, Any, List

FEATURE_NAMES = [
    "planned_duration_days",
    "days_elapsed",
    "current_progress_pct",
    "planned_progress_pct_at_this_point",
    "progress_variance_pct",
    "manpower_ratio",
    "equipment_availability_recent_avg",
    "material_availability_recent_avg",
    "velocity_ratio",
    "contractor_historical_delay_rate",
    "contractor_past_projects",
    "planned_days_remaining"
]

def extract_features_from_dict(data: Dict[str, Any]) -> np.ndarray:
    planned_duration = float(data.get("planned_duration_days", 30.0))
    days_elapsed = float(data.get("days_elapsed", 10.0))
    current_progress = float(data.get("current_progress_pct", 0.0))
    planned_progress = float(data.get("planned_progress_pct_at_this_point", 0.0))
    progress_variance = current_progress - planned_progress
    
    planned_manpower = max(1.0, float(data.get("planned_manpower", 10.0)))
    recent_manpower = float(data.get("manpower_recent_avg", planned_manpower))
    manpower_ratio = min(2.5, recent_manpower / planned_manpower)
    
    equipment_avail = float(data.get("equipment_availability_recent_avg", 85.0))
    material_avail = float(data.get("material_availability_recent_avg", 90.0))
    
    v_recent = float(data.get("progress_velocity_recent", 1.5))
    v_early = max(0.1, float(data.get("progress_velocity_early", 1.5)))
    velocity_ratio = min(3.0, v_recent / v_early)
    
    contractor_delay_rate = float(data.get("contractor_historical_delay_rate", 0.15))
    contractor_projects = float(data.get("contractor_past_projects", 10.0))
    planned_days_remaining = max(0.0, float(data.get("planned_days_remaining_at_snapshot", planned_duration - days_elapsed)))
    
    features = [
        planned_duration,
        days_elapsed,
        current_progress,
        planned_progress,
        progress_variance,
        manpower_ratio,
        equipment_avail,
        material_avail,
        velocity_ratio,
        contractor_delay_rate,
        contractor_projects,
        planned_days_remaining
    ]
    return np.array(features, dtype=float).reshape(1, -1)
