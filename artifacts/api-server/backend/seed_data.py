import datetime
import os
import json
import pandas as pd
from backend.database.database import SessionLocal, engine, Base
from backend.models.project import Project
from backend.models.activity import Activity
from backend.models.progress_update import ProgressUpdate
from backend.models.site_update import SiteUpdate
from backend.models.match_result import MatchResult
from backend.models.report import Report
from backend.services.variance_service import variance_engine

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding Flagship Infrastructure Project: East-West Gas Pipeline Expansion...")

    now = datetime.datetime.utcnow()
    p_start = now - datetime.timedelta(days=45)
    p_finish = now + datetime.timedelta(days=135)
    snapshot = now

    project = Project(
        name="East-West Gas Pipeline Expansion",
        code="EW-GAS-2026",
        description="480km High-Pressure Natural Gas Pipeline Expansion (Sector 4: Compressor & Station Tie-ins)",
        location="Gujarat - Rajasthan Corridor, Sector 4",
        client="National Gas & Infrastructure Corporation (NGIC)",
        contractor="Larsen & Petro Engineering JV",
        baseline_start=p_start,
        baseline_finish=p_finish,
        current_snapshot_date=snapshot,
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Activity Catalog (L1 to L6)
    activities_data = [
        # L1 / L2
        {"code": "EW-L1-001", "name": "East-West Gas Pipeline Sector 4 EPC", "wbs": "1", "level": "L1", "disc": "General", "days_offset": -45, "dur": 180, "prog": 42.0, "notes": "Project Level WBS Node"},
        {"code": "CIV-L2-001", "name": "Civil & Structural Works Package", "wbs": "1.1", "level": "L2", "disc": "Civil", "days_offset": -45, "dur": 120, "prog": 68.0, "notes": "Civil Sub-package"},
        {"code": "PIP-L2-001", "name": "Mainline & Station Piping Package", "wbs": "1.2", "level": "L2", "disc": "Piping", "days_offset": -30, "dur": 150, "prog": 40.0, "notes": "Piping Sub-package"},
        {"code": "MEC-L2-001", "name": "Static & Rotary Equipment Package", "wbs": "1.3", "level": "L2", "disc": "Mechanical", "days_offset": -15, "dur": 110, "prog": 25.0, "notes": "Mechanical Sub-package"},
        {"code": "ELE-L2-001", "name": "Power Distribution & Substation Package", "wbs": "1.4", "level": "L2", "disc": "Electrical", "days_offset": -20, "dur": 100, "prog": 32.0, "notes": "Electrical Sub-package"},
        {"code": "HSE-L2-001", "name": "Health, Safety & Environmental Assurance", "wbs": "1.5", "level": "L2", "disc": "HSE", "days_offset": -45, "dur": 180, "prog": 80.0, "notes": "HSE Protocol Package"},

        # Civil Activities (L5 / L6)
        {"code": "CIV-L5-010", "name": "Route Grading & ROW Trench Excavation Km 12-28", "wbs": "1.1.1.1.1", "level": "L5", "disc": "Civil", "days_offset": -45, "dur": 40, "prog": 100.0, "notes": "Completed trenching on ROW corridor"},
        {"code": "CIV-L5-012", "name": "Reinforced Concrete Pile Cap & Foundation for Compressor Skid", "wbs": "1.1.1.1.2", "level": "L5", "disc": "Civil", "days_offset": -35, "dur": 30, "prog": 92.0, "notes": "28-day cylinder compressive strength achieved"},
        {"code": "CIV-L6-015", "name": "Valve Pit #4 Concrete Pouring, Shuttering & Curing", "wbs": "1.1.1.1.3.1", "level": "L6", "disc": "Civil", "days_offset": -10, "dur": 25, "prog": 75.0, "notes": "Wall pour #2 completed, curing in progress"},
        {"code": "CIV-L6-018", "name": "Anchor Block Cast-in-Place for 24\" River Crossing", "wbs": "1.1.1.1.3.2", "level": "L6", "disc": "Civil", "days_offset": -5, "dur": 20, "prog": 30.0, "notes": "Rebar binding active"},

        # Piping Activities (L5 / L6) - Including PIP-L6-024 Demo Activity
        {"code": "PIP-L5-020", "name": "Mainline 24\" API 5L X70 Pipe Stringing & Cold Bending", "wbs": "1.2.1.1.1", "level": "L5", "disc": "Piping", "days_offset": -30, "dur": 35, "prog": 90.0, "notes": "Stringing 90% completed across Km 12-28"},
        {"code": "PIP-L5-022", "name": "Automatic Orbital Trench Welding & Ultrasonic NDT Inspection", "wbs": "1.2.1.1.2", "level": "L5", "disc": "Piping", "days_offset": -20, "dur": 45, "prog": 50.0, "notes": "NDT pass rate 98.4%"},
        {"code": "PIP-L6-024", "name": "Erect Line 24\"-XX Compressor Station Tie-in Spools", "wbs": "1.2.1.1.3.1", "level": "L6", "disc": "Piping", "days_offset": -25, "dur": 40, "prog": 45.0, "notes": "Target Activity: Spool fit-up and golden weld tie-in"},
        {"code": "PIP-L6-026", "name": "18\" Bypass Loop Header Fabrication & Hydro-Flange Assembly", "wbs": "1.2.1.1.3.2", "level": "L6", "disc": "Piping", "days_offset": -10, "dur": 30, "prog": 20.0, "notes": "Flange facing check in progress"},
        {"code": "PIP-L6-028", "name": "Hydrostatic Pressure Testing Sector 4 (Section A 120 Bar)", "wbs": "1.2.1.1.4.1", "level": "L6", "disc": "Piping", "days_offset": 20, "dur": 20, "prog": 0.0, "notes": "Scheduled post tie-in completion"},

        # Mechanical Activities (L5 / L6)
        {"code": "MEC-L5-031", "name": "Centrifugal Gas Compressor Unit 01 Skid Rigging & Positioning", "wbs": "1.3.1.1.1", "level": "L5", "disc": "Mechanical", "days_offset": -15, "dur": 25, "prog": 60.0, "notes": "Skid landed on anchor foundation"},
        {"code": "MEC-L6-035", "name": "Turbine Lube Oil System Stainless Piping & High-Velocity Flush", "wbs": "1.3.1.1.2.1", "level": "L6", "disc": "Mechanical", "days_offset": -8, "dur": 22, "prog": 35.0, "notes": "Flush oil cleanliness NAS 6 verification"},
        {"code": "MEC-L6-038", "name": "Suction Scrubber & Knock-Out Drum Internal Demister Installation", "wbs": "1.3.1.1.2.2", "level": "L6", "disc": "Mechanical", "days_offset": -2, "dur": 18, "prog": 10.0, "notes": "Internals inspection passed"},

        # Electrical & Instrumentation (L5 / L6)
        {"code": "ELE-L5-041", "name": "High Voltage 33kV Armored Cable Trenching & Sand Bedding", "wbs": "1.4.1.1.1", "level": "L5", "disc": "Electrical", "days_offset": -20, "dur": 30, "prog": 80.0, "notes": "Cable laying completed, backfill in progress"},
        {"code": "ELE-L6-044", "name": "Transformer Substation T-102 High-Pot Testing & Panel Termination", "wbs": "1.4.1.1.2.1", "level": "L6", "disc": "Electrical", "days_offset": -10, "dur": 25, "prog": 40.0, "notes": "Secondary terminations active"},
        {"code": "ELE-L6-048", "name": "Emergency Gas Detection & Optical Flame Sensor Loop Checking", "wbs": "1.4.1.1.3.1", "level": "L6", "disc": "Electrical", "days_offset": 5, "dur": 20, "prog": 0.0, "notes": "Pending panel power-up"},

        # HSE Activities
        {"code": "HSE-L5-051", "name": "Hot Work Containment Barriers & Gas Sniffing Station Setup", "wbs": "1.5.1.1.1", "level": "L5", "disc": "HSE", "days_offset": -40, "dur": 30, "prog": 100.0, "notes": "Active permit-to-work station"},
        {"code": "HSE-L6-054", "name": "Emergency Evacuation Sirens & High-Pressure Blast Wall Inspection", "wbs": "1.5.1.1.2.1", "level": "L6", "disc": "HSE", "days_offset": -15, "dur": 20, "prog": 70.0, "notes": "Bi-weekly safety audit completed"}
    ]

    act_objects = {}
    for d in activities_data:
        p_act_start = project.baseline_start + datetime.timedelta(days=d["days_offset"] + 45)
        p_act_finish = p_act_start + datetime.timedelta(days=d["dur"])
        
        act = Activity(
            project_id=project.id,
            activity_code=d["code"],
            activity_name=d["name"],
            wbs_code=d["wbs"],
            wbs_level=d["level"],
            discipline=d["disc"],
            planned_start=p_act_start,
            planned_finish=p_act_finish,
            planned_duration=d["dur"],
            actual_start=p_act_start if d["prog"] > 0 else None,
            actual_finish=p_act_finish if d["prog"] >= 100.0 else None,
            actual_progress=d["prog"],
            contractor_id="Larsen & Petro Engineering JV",
            notes=d["notes"],
            status="COMPLETED" if d["prog"] >= 100 else ("IN_PROGRESS" if d["prog"] > 0 else "NOT_STARTED")
        )
        db.add(act)
        db.commit()
        db.refresh(act)
        act_objects[d["code"]] = act

    # Recalculate variances
    variance_engine.update_project_variances(db, project)

    # Historical Progress Updates for PIP-L6-024
    pip_target = act_objects.get("PIP-L6-024")
    if pip_target:
        history = [
            {"prog": 15.0, "days_ago": 18, "remarks": "Staging and pre-rigging 24 inch spools at Sector 4 tie-in header.", "rev": "Site Inspector"},
            {"prog": 30.0, "days_ago": 11, "remarks": "Completed flange fit-up and initial root pass welding on joint J-01 & J-02.", "rev": "Welding QC Lead"},
            {"prog": 45.0, "days_ago": 4, "remarks": "Completed hot pass and filler pass on mainline 24 inch tie-in joint.", "rev": "Site Supervisor"}
        ]
        for h in history:
            pu = ProgressUpdate(
                activity_id=pip_target.id,
                progress_percentage=h["prog"],
                previous_percentage=max(0.0, h["prog"] - 15.0),
                status="IN_PROGRESS",
                actual_start=pip_target.actual_start,
                source="HISTORICAL_LOG",
                confidence=1.0,
                remarks=h["remarks"],
                reviewer_name=h["rev"],
                created_at=now - datetime.timedelta(days=h["days_ago"])
            )
            db.add(pu)
        db.commit()

    # Create Pending Site Update in Review Queue (The Core SIH Demo Scenario)
    print("Creating Demo Scenario: Pending site update for PIP-L6-024...")
    site_up_1 = SiteUpdate(
        project_id=project.id,
        raw_text="Erection of 24 inch line completed up to 60% with 14 certified welders on site.",
        progress_pct=60.0,
        status="IN_PROGRESS",
        date=now - datetime.timedelta(hours=3),
        remarks="Golden weld tie-in joint #04 capping completed. Radiography clearance scheduled for night shift.",
        location="Sector 4 Compressor Station Header Point B",
        contractor="Larsen & Petro Engineering JV",
        photo_url="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
        matched_activity_id=pip_target.id if pip_target else None,
        match_confidence=0.76,
        match_method="HYBRID_TFIDF_DOMAIN",
        review_status="PENDING"
    )
    db.add(site_up_1)
    db.commit()
    db.refresh(site_up_1)

    # Match results for this update
    mr1 = MatchResult(
        site_update_id=site_up_1.id,
        activity_id=pip_target.id if pip_target else 1,
        confidence_score=0.76,
        match_method="HYBRID_TFIDF_DOMAIN",
        score_breakdown=json.dumps({"tfidf_similarity": 0.68, "domain_entity_boost": 0.32, "wbs_executable_weight": 0.08}),
        top_keywords=json.dumps(["24 inch", "line", "erection", "welder"]),
        requires_review=True,
        rank=1
    )
    db.add(mr1)

    # Second pending update for Civil
    civ_target = act_objects.get("CIV-L6-015")
    site_up_2 = SiteUpdate(
        project_id=project.id,
        raw_text="Valve Pit #4 shuttering stripped and curing water blanket applied. Concrete test cube passed 32 MPa.",
        progress_pct=85.0,
        status="IN_PROGRESS",
        date=now - datetime.timedelta(hours=6),
        remarks="Ready for waterproof membrane application.",
        location="Km 18 Valve Station Pit",
        contractor="Apex Civil Subcontractors",
        photo_url="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        matched_activity_id=civ_target.id if civ_target else None,
        match_confidence=0.82,
        match_method="HYBRID_TFIDF_DOMAIN",
        review_status="PENDING"
    )
    db.add(site_up_2)
    db.commit()

    if os.getenv("SITEFLOW_SKIP_SAMPLE_FILES") == "1":
        print("Demo dataset seeded without rewriting sample files.")
        db.close()
        return

    # Generate companion sample files
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data")
    os.makedirs(sample_dir, exist_ok=True)

    # 1. Schedule CSV & XLSX
    df_schedule = pd.DataFrame([{
        "Activity ID": d["code"],
        "Activity Name": d["name"],
        "WBS Code": d["wbs"],
        "WBS Level": d["level"],
        "Discipline": d["disc"],
        "Planned Start": (project.baseline_start + datetime.timedelta(days=d["days_offset"] + 45)).strftime("%Y-%m-%d"),
        "Planned Finish": (project.baseline_start + datetime.timedelta(days=d["days_offset"] + 45 + d["dur"])).strftime("%Y-%m-%d"),
        "Planned Duration": d["dur"],
        "Actual Progress %": d["prog"],
        "Contractor": "Larsen & Petro Engineering JV"
    } for d in activities_data])

    csv_path = os.path.join(sample_dir, "east_west_pipeline_schedule.csv")
    xlsx_path = os.path.join(sample_dir, "east_west_pipeline_schedule.xlsx")
    df_schedule.to_csv(csv_path, index=False)
    df_schedule.to_excel(xlsx_path, index=False)

    # 2. Sample DPR Text Report
    dpr_text = """
================================================================================
DAILY PROGRESS REPORT (DPR) - SECTOR 4 GAS EXPANSION
================================================================================
Date: 02-Sep-2026
Report Ref: DPR/EW-GAS/2026/089
Contractor: Larsen & Petro Engineering JV
Weather: Clear / 34°C / Wind 12 km/h
Total Site Manpower: 148 Personnel (Civil: 45, Piping: 58, Mech: 25, Elec: 20)
Working Hours: 07:00 - 18:30 (Day Shift) + 19:00 - 03:00 (Welding QC Shift)

EXECUTIVE SUMMARY OF SITE EXECUTION:
1. PIPING DISCIPLINE:
   - Erect Line 24"-XX Compressor Station Tie-in Spools achieved 60% progress.
   - Welders completed joint J-03 and hot pass on J-04. NDT ultrasonic testing passed.
   - Mainline 24" pipe stringing along Km 22 completed up to 90%.

2. CIVIL & STRUCTURAL:
   - Valve Pit #4 concrete wall curing maintained at 85% progress.
   - Anchor block rebar cage positioning for river crossing reached 30%.

3. MECHANICAL & ROTARY:
   - Centrifugal Gas Compressor Unit 01 alignment and anchor torquing at 60%.
   - Turbine lube oil stainless lines flush cycle 1 completed (35% progress).

4. ELECTRICAL & SUBSTATION:
   - Transformer Substation T-102 secondary control terminations reached 40%.

SAFETY / HSE OBSERVATIONS:
- Zero Lost Time Incidents (LTI).
- Hot work permit active for 24 inch compressor tie-in spooling.
- Gas sniffers operational with 0.0 ppm LEL detected.
================================================================================
    """.strip()

    with open(os.path.join(sample_dir, "sample_daily_site_report.txt"), "w") as f:
        f.write(dpr_text)

    print("Demo dataset seeded successfully! Schedule files and DPR written to sample_data/")
    db.close()

if __name__ == "__main__":
    seed_database()
