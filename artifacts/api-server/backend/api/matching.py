from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.schemas.schemas import MatchingRequest, MatchingResponse, MatchResultItem
from backend.services.matching_service import matching_service

router = APIRouter(prefix="/api/matching", tags=["Intelligent Activity Matching"])

@router.post("", response_model=MatchingResponse)
def match_text_to_activities(req: MatchingRequest, db: Session = Depends(get_db)):
    try:
        res = matching_service.match_update_to_activities(
            db=db,
            project_id=req.project_id,
            raw_text=req.raw_text,
            discipline_hint=req.discipline_hint,
            top_k=req.top_k or 5
        )
        matches_objs = [MatchResultItem(**m) for m in res["matches"]]
        top_match_obj = MatchResultItem(**res["top_match"]) if res["top_match"] else None

        return MatchingResponse(
            top_match=top_match_obj,
            matches=matches_objs,
            requires_review=res["requires_review"],
            overall_confidence=res["overall_confidence"],
            explanation=res["explanation"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching Error: {str(e)}")
