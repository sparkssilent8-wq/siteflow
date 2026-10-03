import io
import datetime
import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.activity import Activity
from backend.models.project import Project
from backend.services.variance_service import variance_engine

class ScheduleImportService:
    def _normalize_col_names(self, df: pd.DataFrame) -> pd.DataFrame:
        mapping = {}
        for col in df.columns:
            c_clean = str(col).strip().lower().replace(" ", "_").replace("-", "_")
            if any(k in c_clean for k in ["activity_id", "act_id", "task_code", "activity_code", "code"]):
                mapping[col] = "activity_code"
            elif any(k in c_clean for k in ["activity_name", "task_name", "name", "description"]):
                mapping[col] = "activity_name"
            elif any(k in c_clean for k in ["wbs_code", "wbs_id", "wbs"]):
                mapping[col] = "wbs_code"
            elif any(k in c_clean for k in ["wbs_level", "level"]):
                mapping[col] = "wbs_level"
            elif any(k in c_clean for k in ["discipline", "trade", "department"]):
                mapping[col] = "discipline"
            elif any(k in c_clean for k in ["planned_start", "start_date", "start", "target_start"]):
                mapping[col] = "planned_start"
            elif any(k in c_clean for k in ["planned_finish", "finish_date", "finish", "target_finish", "end_date"]):
                mapping[col] = "planned_finish"
            elif any(k in c_clean for k in ["planned_duration", "duration", "days", "orig_dur"]):
                mapping[col] = "planned_duration"
            elif any(k in c_clean for k in ["predecessor", "predecessors", "pred"]):
                mapping[col] = "predecessor"
            elif any(k in c_clean for k in ["actual_progress", "progress", "percent_complete", "%_complete", "actual_%"]):
                mapping[col] = "actual_progress"
            elif any(k in c_clean for k in ["contractor", "contractor_id", "vendor"]):
                mapping[col] = "contractor_id"
        return df.rename(columns=mapping)

    def _parse_date(self, val: Any) -> datetime.datetime:
        if pd.isna(val) or val is None or str(val).strip() == "":
            return None
        try:
            return pd.to_datetime(val).to_pydatetime()
        except:
            return None

    def _infer_wbs_level(self, wbs_code: str, explicit_level: str = None) -> str:
        if explicit_level and str(explicit_level).upper().startswith("L"):
            return str(explicit_level).upper()
        if not wbs_code:
            return "L5"
        dots = str(wbs_code).count(".")
        level_map = {0: "L1", 1: "L2", 2: "L3", 3: "L4", 4: "L5", 5: "L6"}
        return level_map.get(dots, "L5" if dots < 5 else "L6")

    def parse_and_import(self, db: Session, project_id: int, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} not found.")

        # Read into DataFrame
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Please upload .csv or .xlsx files.")

        df = self._normalize_col_names(df)

        if "activity_code" not in df.columns or "activity_name" not in df.columns:
            raise ValueError("Schedule file must contain at least 'Activity Code' and 'Activity Name' columns.")

        imported_activities = []
        l5_l6_count = 0

        for _, row in df.iterrows():
            code = str(row.get("activity_code", "")).strip()
            name = str(row.get("activity_name", "")).strip()
            if not code or not name or pd.isna(code):
                continue

            wbs_code = str(row.get("wbs_code", "")).strip() if pd.notna(row.get("wbs_code")) else None
            explicit_lvl = str(row.get("wbs_level", "")).strip() if pd.notna(row.get("wbs_level")) else None
            wbs_level = self._infer_wbs_level(wbs_code, explicit_lvl)
            
            if wbs_level in ["L5", "L6"]:
                l5_l6_count += 1

            discipline = str(row.get("discipline", "General")).strip() if pd.notna(row.get("discipline")) else "General"
            
            p_start = self._parse_date(row.get("planned_start"))
            p_finish = self._parse_date(row.get("planned_finish"))
            
            duration = int(row.get("planned_duration", 1)) if pd.notna(row.get("planned_duration")) else 1
            if p_start and p_finish and (p_finish > p_start) and duration == 1:
                duration = max(1, (p_finish - p_start).days)
            elif p_start and not p_finish:
                p_finish = p_start + datetime.timedelta(days=duration)

            predecessor = str(row.get("predecessor", "")).strip() if pd.notna(row.get("predecessor")) else None
            actual_prog = float(row.get("actual_progress", 0.0)) if pd.notna(row.get("actual_progress")) else 0.0
            contractor = str(row.get("contractor_id", "")).strip() if pd.notna(row.get("contractor_id")) else project.contractor

            # Upsert by activity_code
            existing = db.query(Activity).filter(
                Activity.project_id == project_id,
                Activity.activity_code == code
            ).first()

            if existing:
                existing.activity_name = name
                existing.wbs_code = wbs_code
                existing.wbs_level = wbs_level
                existing.discipline = discipline
                existing.planned_start = p_start
                existing.planned_finish = p_finish
                existing.planned_duration = duration
                existing.predecessor = predecessor
                existing.actual_progress = actual_prog
                existing.contractor_id = contractor
                imported_activities.append(existing)
            else:
                new_act = Activity(
                    project_id=project_id,
                    activity_code=code,
                    activity_name=name,
                    wbs_code=wbs_code,
                    wbs_level=wbs_level,
                    discipline=discipline,
                    planned_start=p_start,
                    planned_finish=p_finish,
                    planned_duration=duration,
                    predecessor=predecessor,
                    actual_progress=actual_prog,
                    contractor_id=contractor,
                    status="NOT_STARTED" if actual_prog == 0 else "IN_PROGRESS"
                )
                db.add(new_act)
                imported_activities.append(new_act)

        db.commit()

        # Recalculate variances
        variance_stats = variance_engine.update_project_variances(db, project)

        return {
            "project_id": project_id,
            "filename": filename,
            "total_activities_imported": len(imported_activities),
            "l5_l6_activities_count": l5_l6_count,
            "variance_summary": variance_stats
        }

schedule_service = ScheduleImportService()
