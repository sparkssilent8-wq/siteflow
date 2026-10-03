import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.activity import Activity
from backend.models.project import Project

class ScheduleVarianceEngine:
    def calculate_activity_variance(self, act: Activity, snapshot_date: datetime.datetime) -> Dict[str, Any]:
        planned_start = act.planned_start or snapshot_date
        planned_finish = act.planned_finish or (planned_start + datetime.timedelta(days=act.planned_duration or 1))
        planned_duration = max(1, act.planned_duration or (planned_finish - planned_start).days or 1)
        
        # 1. Planned Progress calculation at snapshot date
        if snapshot_date < planned_start:
            planned_prog = 0.0
        elif snapshot_date >= planned_finish:
            planned_prog = 100.0
        else:
            elapsed_days = (snapshot_date - planned_start).total_seconds() / 86400.0
            planned_prog = min(100.0, max(0.0, (elapsed_days / planned_duration) * 100.0))

        actual_prog = act.actual_progress or 0.0
        progress_variance = round(actual_prog - planned_prog, 1) # positive = ahead, negative = behind

        # 2. Earned Duration vs Elapsed Duration
        earned_duration = round(planned_duration * (actual_prog / 100.0), 1)
        if snapshot_date < planned_start:
            elapsed_duration = 0.0
        else:
            elapsed_duration = min(float(planned_duration), max(0.0, (snapshot_date - planned_start).total_seconds() / 86400.0))
        
        schedule_variance_days = round(earned_duration - elapsed_duration, 1)

        # 3. Status Classification
        if actual_prog >= 100.0:
            status = "COMPLETED"
        elif progress_variance < -12.0:
            status = "DELAYED"
        elif progress_variance < 0.0:
            status = "AT_RISK"
        elif actual_prog > 0.0:
            status = "IN_PROGRESS"
        else:
            status = "NOT_STARTED"

        # 4. Risk Level
        if status == "DELAYED" or progress_variance < -15.0:
            risk_level = "HIGH" if progress_variance > -25.0 else "CRITICAL"
        elif status == "AT_RISK" or progress_variance < -5.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "planned_progress": round(planned_prog, 1),
            "actual_progress": round(actual_prog, 1),
            "progress_variance": progress_variance,
            "schedule_variance_days": schedule_variance_days,
            "earned_duration": earned_duration,
            "elapsed_duration": round(elapsed_duration, 1),
            "planned_duration": planned_duration,
            "status": status,
            "risk_level": risk_level
        }

    def update_project_variances(self, db: Session, project: Project) -> Dict[str, Any]:
        snapshot_date = project.current_snapshot_date or datetime.datetime.utcnow()
        activities = db.query(Activity).filter(Activity.project_id == project.id).all()
        
        if not activities:
            return {}

        total_planned = 0.0
        total_actual = 0.0
        delayed_count = 0
        at_risk_count = 0
        on_track_count = 0
        completed_count = 0
        total_slippage_days = 0.0

        for act in activities:
            metrics = self.calculate_activity_variance(act, snapshot_date)
            act.planned_progress = metrics["planned_progress"]
            act.progress_variance = metrics["progress_variance"]
            act.schedule_variance_days = metrics["schedule_variance_days"]
            act.status = metrics["status"]
            act.risk_level = metrics["risk_level"]

            total_planned += act.planned_progress
            total_actual += (act.actual_progress or 0.0)

            if act.status == "COMPLETED":
                completed_count += 1
            elif act.status == "DELAYED":
                delayed_count += 1
                total_slippage_days += abs(act.schedule_variance_days)
            elif act.status == "AT_RISK":
                at_risk_count += 1
                total_slippage_days += abs(act.schedule_variance_days)
            else:
                on_track_count += 1

        n = len(activities)
        project.overall_planned_progress = round(total_planned / n, 1)
        project.overall_actual_progress = round(total_actual / n, 1)
        db.commit()

        return {
            "overall_planned_progress": project.overall_planned_progress,
            "overall_actual_progress": project.overall_actual_progress,
            "overall_progress_variance": round(project.overall_actual_progress - project.overall_planned_progress, 1),
            "total_schedule_slippage_days": round(total_slippage_days, 1),
            "delayed_activities_count": delayed_count,
            "at_risk_activities_count": at_risk_count,
            "on_track_activities_count": on_track_count,
            "completed_activities_count": completed_count
        }

variance_engine = ScheduleVarianceEngine()
