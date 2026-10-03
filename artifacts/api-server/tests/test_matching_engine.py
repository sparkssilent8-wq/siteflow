import pytest
from backend.database.database import SessionLocal
from backend.services.matching_service import matching_service

def test_matching_service_piping():
    db = SessionLocal()
    try:
        res = matching_service.match_update_to_activities(
            db=db,
            project_id=1,
            raw_text="Erection of 24 inch line completed up to 60% with 14 welders on site",
            top_k=3
        )
        assert res["top_match"] is not None
        assert res["top_match"]["activity_code"] == "PIP-L6-024"
        assert res["top_match"]["confidence_score"] >= 0.70
        assert "24 inch" in res["top_match"]["matched_keywords"] or "24\"" in res["explanation"]
    finally:
        db.close()

def test_matching_service_civil():
    db = SessionLocal()
    try:
        res = matching_service.match_update_to_activities(
            db=db,
            project_id=1,
            raw_text="Concrete pour for Valve Pit #4 curing blanket applied",
            top_k=3
        )
        assert res["top_match"] is not None
        assert res["top_match"]["activity_code"] == "CIV-L6-015"
        assert res["top_match"]["discipline"] == "Civil"
    finally:
        db.close()
