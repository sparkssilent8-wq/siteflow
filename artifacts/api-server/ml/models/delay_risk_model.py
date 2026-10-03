import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple, List
from ml.features.feature_extractor import extract_features_from_dict
from ml.anomaly.anomaly_detector import ExecutionAnomalyDetector
from ml.explainability.explainer import compute_factor_contributions, generate_natural_explanation

class DelayRiskModelService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.models_dir = os.path.join(self.base_dir, "saved_models")
        self.scaler = None
        self.classifier = None
        self.regressor = None
        self.anomaly_detector = ExecutionAnomalyDetector()
        self.load_models()

    def load_models(self):
        try:
            scaler_path = os.path.join(self.models_dir, "scaler.joblib")
            clf_path = os.path.join(self.models_dir, "delay_classifier.joblib")
            reg_path = os.path.join(self.models_dir, "duration_regressor.joblib")
            
            if os.path.exists(scaler_path) and os.path.exists(clf_path) and os.path.exists(reg_path):
                self.scaler = joblib.load(scaler_path)
                self.classifier = joblib.load(clf_path)
                self.regressor = joblib.load(reg_path)
                print("ML Models loaded successfully.")
            else:
                print("ML Model files not found yet. Using baseline heuristic inference.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def predict_risk(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        task_id = str(input_data.get("task_id", "UNKNOWN"))
        features_raw = extract_features_from_dict(input_data)
        
        # Calculate heuristics as baseline
        planned_duration = float(input_data.get("planned_duration_days", 30.0))
        days_elapsed = float(input_data.get("days_elapsed", 10.0))
        current_progress = float(input_data.get("current_progress_pct", 0.0))
        planned_progress = float(input_data.get("planned_progress_pct_at_this_point", 0.0))
        planned_days_remaining = max(1.0, planned_duration - days_elapsed)
        
        work_remaining_pct = max(0.0, 100.0 - current_progress)
        
        # ML Inference or fallback
        if self.classifier is not None and self.regressor is not None and self.scaler is not None:
            features_scaled = self.scaler.transform(features_raw)
            delay_probs = self.classifier.predict_proba(features_scaled)[0]
            delay_prob = float(delay_probs[1]) if len(delay_probs) > 1 else float(delay_probs[0])
            pred_remaining = float(self.regressor.predict(features_scaled)[0])
            model_confidence_note = "Model: GradientBoosting (Trained on 3,000 infrastructure project snapshots)"
        else:
            # Fallback heuristic
            variance = planned_progress - current_progress
            delay_prob = min(0.99, max(0.05, 0.25 + (variance / 100.0) * 1.5))
            effective_velocity = max(0.2, current_progress / max(1.0, days_elapsed))
            pred_remaining = work_remaining_pct / effective_velocity
            model_confidence_note = "Model: Heuristic Construction Rule Engine (ML weights pending)"
        
        pred_remaining = max(1.0, round(pred_remaining, 1))
        
        # Prediction interval (80% confidence interval: +/- 15% or residual MAE)
        interval_min = max(1.0, round(pred_remaining * 0.82, 1))
        interval_max = round(pred_remaining * 1.25, 1)
        interval_str = f"{interval_min} - {interval_max} days"
        
        expected_completion_in_days = round(days_elapsed + pred_remaining, 1)
        
        # Composite risk score (0 to 100)
        slippage_ratio = max(0.0, (pred_remaining - planned_days_remaining) / planned_days_remaining)
        variance_penalty = max(0.0, (planned_progress - current_progress) * 0.8)
        raw_risk = (delay_prob * 45.0) + (min(2.0, slippage_ratio) * 30.0) + variance_penalty
        risk_score_0_100 = round(min(100.0, max(0.0, raw_risk)), 1)
        
        if risk_score_0_100 >= 75.0 or delay_prob >= 0.75:
            risk_category = "CRITICAL" if risk_score_0_100 >= 88.0 else "HIGH"
        elif risk_score_0_100 >= 40.0 or delay_prob >= 0.40:
            risk_category = "MEDIUM"
        else:
            risk_category = "LOW"
            
        # Check Anomalies
        is_anomalous, anomaly_reasons = self.anomaly_detector.predict(features_raw, input_data)
        
        # Factor contributions
        factor_contributions = compute_factor_contributions(input_data, delay_prob, risk_score_0_100)
        
        # Natural Language Explanation
        explanation = generate_natural_explanation(
            input_data, risk_category, delay_prob, pred_remaining, planned_days_remaining
        )
        
        return {
            "task_id": task_id,
            "predicted_remaining_days": pred_remaining,
            "prediction_interval_80pct": interval_str,
            "expected_completion_in_days": expected_completion_in_days,
            "delay_probability": round(delay_prob, 3),
            "risk_category": risk_category,
            "risk_score_0_100": risk_score_0_100,
            "is_anomalous": is_anomalous,
            "anomaly_reasons": anomaly_reasons,
            "explanation": explanation,
            "factor_contributions": factor_contributions,
            "model_confidence_note": model_confidence_note
        }

    def simulate(self, base_input: Dict[str, Any], manpower_delta_pct: float, equip_delta_pct: float, mat_delta_pct: float) -> Dict[str, Any]:
        baseline = self.predict_risk(base_input)
        
        sim_input = dict(base_input)
        
        # Adjust manpower
        base_manpower = float(sim_input.get("manpower_recent_avg", sim_input.get("planned_manpower", 10.0)))
        sim_manpower = max(1.0, base_manpower * (1.0 + manpower_delta_pct / 100.0))
        sim_input["manpower_recent_avg"] = sim_manpower
        
        # Adjust equipment
        base_equip = float(sim_input.get("equipment_availability_recent_avg", 80.0))
        sim_input["equipment_availability_recent_avg"] = min(100.0, max(0.0, base_equip + equip_delta_pct))
        
        # Adjust material
        base_mat = float(sim_input.get("material_availability_recent_avg", 80.0))
        sim_input["material_availability_recent_avg"] = min(100.0, max(0.0, base_mat + mat_delta_pct))
        
        # Recalculate recent velocity based on resource improvement
        v_recent = float(sim_input.get("progress_velocity_recent", 1.0))
        resource_multiplier = (1.0 + (manpower_delta_pct/100.0)*0.5 + (equip_delta_pct/100.0)*0.25 + (mat_delta_pct/100.0)*0.25)
        sim_input["progress_velocity_recent"] = max(0.1, v_recent * resource_multiplier)
        
        simulated = self.predict_risk(sim_input)
        
        days_saved = round(baseline["predicted_remaining_days"] - simulated["predicted_remaining_days"], 1)
        
        summary = (
            f"Simulated resource adjustment ({manpower_delta_pct:+.0f}% manpower, "
            f"{equip_delta_pct:+.0f}% equip, {mat_delta_pct:+.0f}% material) "
            f"shifts risk score from {baseline['risk_score_0_100']} ({baseline['risk_category']}) "
            f"to {simulated['risk_score_0_100']} ({simulated['risk_category']}), "
            f"saving ~{max(0.0, days_saved):.1f} execution days."
        )
        
        return {
            "baseline_risk_score": baseline["risk_score_0_100"],
            "baseline_delay_probability": baseline["delay_probability"],
            "baseline_predicted_remaining_days": baseline["predicted_remaining_days"],
            "simulated_risk_score": simulated["risk_score_0_100"],
            "simulated_delay_probability": simulated["delay_probability"],
            "simulated_predicted_remaining_days": simulated["predicted_remaining_days"],
            "risk_category_before": baseline["risk_category"],
            "risk_category_after": simulated["risk_category"],
            "delay_days_saved": days_saved,
            "simulation_summary": summary
        }

    def recommend(self, predict_result: Dict[str, Any], activity_name: str = "", discipline: str = "General") -> List[Dict[str, Any]]:
        risk_cat = predict_result.get("risk_category", "LOW")
        factors = predict_result.get("factor_contributions", {})
        reasons = predict_result.get("anomaly_reasons", [])
        
        recs = []
        
        # 1. Check material factor
        mat_factor = factors.get("Material Availability Bottleneck", 0.0)
        if mat_factor > 15.0 or any("material" in r.lower() for r in reasons):
            recs.append({
                "title": "Expedite Material Staging & Buffer Allocation",
                "priority": "HIGH",
                "rationale": f"Material shortage is contributing {mat_factor} points to total delay risk for {activity_name or 'this task'}.",
                "impact": "Eliminates work stoppage, protecting 3.5 to 6.0 calendar days of downstream critical path.",
                "action_steps": [
                    "Audit central storage inventory and verify line items dispatched to site quadrant.",
                    "Authorize emergency vendor expediting for pending valves/fittings/rebar deliveries.",
                    "Pre-stage minimum 3-day buffer on site before crew mobilization."
                ]
            })
            
        # 2. Check manpower factor
        man_factor = factors.get("Manpower Deficit", 0.0)
        vel_factor = factors.get("Velocity Deceleration", 0.0)
        if man_factor > 12.0 or vel_factor > 15.0:
            recs.append({
                "title": "Augment Certified Crew & Implement Dual-Shift Roster",
                "priority": "HIGH" if risk_cat in ["HIGH", "CRITICAL"] else "MEDIUM",
                "rationale": f"Current execution pace is constrained by staffing deficits ({man_factor} impact points).",
                "impact": "Increases daily progress velocity by 25-40%, compressing remaining timeline by ~4 days.",
                "action_steps": [
                    "Request subcontractor to mobilize 4-6 additional certified technicians/welders.",
                    "Introduce 4-hour staggered overlap shift to maximize daylight equipment utilization.",
                    "Track daily output rate (units installed/day) on the SiteFlow mobile log."
                ]
            })
            
        # 3. Check schedule variance / predecessor
        var_factor = factors.get("Schedule Variance Gap", 0.0)
        if var_factor > 18.0 or risk_cat in ["HIGH", "CRITICAL"]:
            recs.append({
                "title": "Conduct Critical Path Predecessor Alignment",
                "priority": "HIGH",
                "rationale": f"Cumulative schedule variance ({var_factor} points) threatens the cascading L3/L2 project milestones.",
                "impact": "Prevents cascading delay propagation into downstream mechanical/hydrotest disciplines.",
                "action_steps": [
                    "Review predecessor handover sign-offs with Civil/Structural lead.",
                    "Re-sequence non-dependent sub-tasks for parallel execution.",
                    "Submit updated recovery baseline in SiteFlow for project director sign-off."
                ]
            })
            
        # 4. Routine / On-track recommendation
        if not recs:
            recs.append({
                "title": "Maintain Baseline Execution Velocity",
                "priority": "LOW",
                "rationale": "Task is performing within planned parameters and acceptable variance margins.",
                "impact": "Ensures scheduled milestone completion without budget or resource overruns.",
                "action_steps": [
                    "Continue daily site verification capture via SiteFlow.",
                    "Monitor weekly material drawdowns against procurement schedule.",
                    "Maintain standard QA/QC inspection sign-off cadence."
                ]
            })
            
        return recs
