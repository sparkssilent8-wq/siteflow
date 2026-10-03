from typing import Dict, Any

class DelayExplainer:
    def explain(self, data: Dict[str, Any], risk_score: float, delay_prob: float) -> Dict[str, Any]:
        pass

def compute_factor_contributions(data: Dict[str, Any], delay_prob: float, risk_score: float) -> Dict[str, float]:
    current_progress = float(data.get("current_progress_pct", 0.0))
    planned_progress = float(data.get("planned_progress_pct_at_this_point", 0.0))
    variance = planned_progress - current_progress # positive if delayed
    
    v_recent = float(data.get("progress_velocity_recent", 1.0))
    v_early = max(0.1, float(data.get("progress_velocity_early", 1.0)))
    vel_drop = max(0.0, 1.0 - (v_recent / v_early))
    
    planned_manpower = max(1.0, float(data.get("planned_manpower", 10.0)))
    recent_manpower = float(data.get("manpower_recent_avg", planned_manpower))
    manpower_deficit = max(0.0, 1.0 - (recent_manpower / planned_manpower))
    
    material_avail = float(data.get("material_availability_recent_avg", 85.0))
    material_shortage = max(0.0, (90.0 - material_avail) / 90.0)
    
    contractor_delay_rate = float(data.get("contractor_historical_delay_rate", 0.15))
    
    # Calculate weighted weights
    w_variance = max(5.0, min(40.0, variance * 1.5))
    w_velocity = max(5.0, min(35.0, vel_drop * 35.0))
    w_manpower = max(5.0, min(25.0, manpower_deficit * 30.0))
    w_material = max(5.0, min(25.0, material_shortage * 30.0))
    w_contractor = max(5.0, min(20.0, contractor_delay_rate * 40.0))
    
    total = w_variance + w_velocity + w_manpower + w_material + w_contractor
    
    return {
        "Schedule Variance Gap": round((w_variance / total) * risk_score, 1),
        "Velocity Deceleration": round((w_velocity / total) * risk_score, 1),
        "Manpower Deficit": round((w_manpower / total) * risk_score, 1),
        "Material Availability Bottleneck": round((w_material / total) * risk_score, 1),
        "Contractor Historical Risk": round((w_contractor / total) * risk_score, 1)
    }

def generate_natural_explanation(data: Dict[str, Any], risk_category: str, delay_prob: float, days_remaining: float, planned_remaining: float) -> str:
    current_progress = float(data.get("current_progress_pct", 0.0))
    planned_progress = float(data.get("planned_progress_pct_at_this_point", 0.0))
    v_recent = float(data.get("progress_velocity_recent", 1.0))
    v_early = max(0.1, float(data.get("progress_velocity_early", 1.0)))
    material_avail = float(data.get("material_availability_recent_avg", 85.0))
    contractor = str(data.get("contractor_id", "Primary Contractor"))
    
    points = []
    
    if current_progress < planned_progress:
        lag = planned_progress - current_progress
        points.append(f"Activity lags planned milestone by {lag:.1f}% ({current_progress:.1f}% actual vs {planned_progress:.1f}% planned).")
    else:
        points.append(f"Activity is currently tracking at {current_progress:.1f}% progress.")
        
    if v_recent < v_early * 0.75:
        points.append(f"Execution velocity dropped by {int((1 - v_recent/v_early)*100)}% from initial run-rate ({v_recent:.2f}%/day vs {v_early:.2f}%/day benchmark).")
        
    if material_avail < 75.0:
        points.append(f"Site material availability is constrained at {material_avail:.0f}%, causing standby losses.")
        
    contractor_delay = float(data.get("contractor_historical_delay_rate", 0.15))
    if contractor_delay > 0.20:
        points.append(f"Assigned contractor ({contractor}) carries an elevated historical slippage rate of {int(contractor_delay*100)}%.")
        
    diff_days = days_remaining - planned_remaining
    if diff_days > 0:
        points.append(f"Model projects {days_remaining:.1f} remaining days required vs {planned_remaining:.1f} baseline days (+{diff_days:.1f} days slippage risk).")
    else:
        points.append(f"Model projects completion within {days_remaining:.1f} days, aligned with schedule baseline.")
        
    return " ".join(points)
