import numpy as np
from typing import Dict, Any, List, Tuple

class ExecutionAnomalyDetector:
    def __init__(self):
        self.model = None

    def check_heuristics(self, data: Dict[str, Any]) -> List[str]:
        reasons = []
        current_progress = float(data.get("current_progress_pct", 0.0))
        planned_progress = float(data.get("planned_progress_pct_at_this_point", 0.0))
        v_recent = float(data.get("progress_velocity_recent", 1.0))
        v_early = float(data.get("progress_velocity_early", 1.0))
        manpower_planned = float(data.get("planned_manpower", 10.0))
        manpower_recent = float(data.get("manpower_recent_avg", 10.0))
        material_avail = float(data.get("material_availability_recent_avg", 90.0))
        equipment_avail = float(data.get("equipment_availability_recent_avg", 90.0))

        # 1. Velocity collapse anomaly
        if v_early > 0.8 and v_recent < (v_early * 0.45):
            reasons.append(f"Severe velocity drop: Recent pace ({v_recent:.2f}%/day) is {int((1 - v_recent/v_early)*100)}% below early pace ({v_early:.2f}%/day)")

        # 2. Critical resource drop
        if manpower_planned > 0 and (manpower_recent / manpower_planned) < 0.60:
            reasons.append(f"Severe manpower deficit: Actual crew ({manpower_recent:.0f}) is only {int(manpower_recent/manpower_planned*100)}% of required staffing ({manpower_planned:.0f})")

        # 3. Supply chain choke
        if material_avail < 55.0:
            reasons.append(f"Critical material bottleneck: Availability rated at {material_avail:.0f}% (threshold 70%)")

        # 4. Equipment shortage
        if equipment_avail < 60.0:
            reasons.append(f"Severe equipment downtime/shortage: Availability at {equipment_avail:.0f}%")

        # 5. Massive schedule divergence
        if (current_progress - planned_progress) < -25.0:
            reasons.append(f"Extreme schedule slippage: Actual progress ({current_progress:.1f}%) is lagging planned baseline ({planned_progress:.1f}%) by {abs(current_progress - planned_progress):.1f}%")

        return reasons

    def predict(self, feature_vec: np.ndarray, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        heuristic_reasons = self.check_heuristics(data)
        is_anomalous = len(heuristic_reasons) > 0
        return is_anomalous, heuristic_reasons
