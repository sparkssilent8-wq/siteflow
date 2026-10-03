import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.activity import Activity
from backend.models.risk_prediction import RiskPrediction
from backend.models.recommendation import Recommendation
from backend.schemas.schemas import (
    MLPredictRequest, MLPredictResponse,
    MLSimulateRequest, MLSimulateResponse,
    MLRecommendRequest, MLRecommendResponse,
    RecommendationItem,
)
from backend.services.ml_client import ml_client, MLServiceError

router = APIRouter(prefix="/api/ml", tags=["ML Delay Risk & Simulation"])


def _get_activity(task_id: str, db: Session):
    try:
        activity_id = int(task_id)
    except (TypeError, ValueError):
        return None
    return db.query(Activity).filter(Activity.id == activity_id).first()


def _save_prediction(result: dict, db: Session):
    activity = _get_activity(result.get("task_id"), db)
    if not activity:
        return None

    prediction = RiskPrediction(
        activity_id=activity.id,
        predicted_remaining_days=result["predicted_remaining_days"],
        prediction_interval_80pct=result.get("prediction_interval_80pct"),
        expected_completion_in_days=result.get("expected_completion_in_days"),
        delay_probability=result["delay_probability"],
        risk_category=result["risk_category"],
        risk_score_0_100=result["risk_score_0_100"],
        is_anomalous=result.get("is_anomalous", False),
        anomaly_reasons=json.dumps(result.get("anomaly_reasons", [])),
        explanation=result.get("explanation"),
        factor_contributions=json.dumps(result.get("factor_contributions", {})),
        model_confidence_note=result.get("model_confidence_note"),
    )
    db.add(prediction)
    activity.risk_level = result["risk_category"]
    db.commit()
    db.refresh(prediction)
    return prediction


@router.post("/predict", response_model=MLPredictResponse)
async def predict_activity_risk(request: MLPredictRequest, db: Session = Depends(get_db)):
    try:
        result = await ml_client.predict(request.model_dump())
    except MLServiceError as exc:
        raise HTTPException(status_code=503, detail={"message": "ML prediction service unavailable", "error": str(exc)}) from exc

    _save_prediction(result, db)
    return MLPredictResponse(**result)


@router.post("/simulate", response_model=MLSimulateResponse)
async def simulate_activity_scenarios(request: MLSimulateRequest):
    try:
        result = await ml_client.simulate(request.model_dump())
        return MLSimulateResponse(**result)
    except MLServiceError as exc:
        raise HTTPException(status_code=503, detail={"message": "ML simulation service unavailable", "error": str(exc)}) from exc


@router.post("/anomaly")
async def detect_anomaly(request: MLPredictRequest, db: Session = Depends(get_db)):
    try:
        result = await ml_client.anomaly(request.model_dump())
    except MLServiceError as exc:
        raise HTTPException(status_code=503, detail={"message": "ML anomaly service unavailable", "error": str(exc)}) from exc

    activity = _get_activity(request.task_id, db)
    if activity:
        latest = db.query(RiskPrediction).filter(
            RiskPrediction.activity_id == activity.id
        ).order_by(RiskPrediction.created_at.desc()).first()
        if latest:
            latest.is_anomalous = result.get("is_anomalous", False)
            latest.anomaly_reasons = json.dumps(result.get("anomaly_reasons", []))
            db.commit()

    return result


@router.post("/recommend", response_model=MLRecommendResponse)
async def get_recommendations(request: MLRecommendRequest, db: Session = Depends(get_db)):
    try:
        result = await ml_client.recommend(request.model_dump())
    except MLServiceError as exc:
        raise HTTPException(status_code=503, detail={"message": "ML recommendation service unavailable", "error": str(exc)}) from exc

    rec_items = [RecommendationItem(**item) for item in result.get("recommendations", [])]
    activity = _get_activity(request.predict_result.task_id, db)
    if activity:
        db.query(Recommendation).filter(Recommendation.activity_id == activity.id).delete(synchronize_session=False)
        for item in rec_items:
            db.add(Recommendation(
                activity_id=activity.id,
                title=item.title,
                priority=item.priority,
                rationale=item.rationale,
                impact=item.impact,
                action_steps=json.dumps(item.action_steps),
            ))
        db.commit()

    return MLRecommendResponse(recommendations=rec_items)


@router.get("/predictions/activity/{activity_id}")
def get_prediction_history(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    predictions = db.query(RiskPrediction).filter(
        RiskPrediction.activity_id == activity_id
    ).order_by(RiskPrediction.created_at.desc()).all()

    return {
        "activity_id": activity_id,
        "count": len(predictions),
        "predictions": [
            {
                "id": p.id,
                "activity_id": p.activity_id,
                "predicted_remaining_days": p.predicted_remaining_days,
                "prediction_interval_80pct": p.prediction_interval_80pct,
                "expected_completion_in_days": p.expected_completion_in_days,
                "delay_probability": p.delay_probability,
                "risk_category": p.risk_category,
                "risk_score_0_100": p.risk_score_0_100,
                "is_anomalous": p.is_anomalous,
                "anomaly_reasons": json.loads(p.anomaly_reasons or "[]"),
                "factor_contributions": json.loads(p.factor_contributions or "{}"),
                "explanation": p.explanation,
                "model_confidence_note": p.model_confidence_note,
                "created_at": p.created_at,
            }
            for p in predictions
        ],
    }


@router.get("/health")
async def ml_health_status():
    try:
        health = await ml_client.health()
        return {
            "status": "healthy",
            "backend_ml_connection": "connected",
            "ml_service_url": ml_client.base_url,
            "ml_service": health,
        }
    except MLServiceError as exc:
        return {
            "status": "degraded",
            "backend_ml_connection": "disconnected",
            "ml_service_url": ml_client.base_url,
            "error": str(exc),
        }
