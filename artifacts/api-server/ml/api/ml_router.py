from fastapi import APIRouter, HTTPException

from ml.api.schemas import (
    MLPredictRequest,
    MLPredictResponse,
    MLSimulateRequest,
    MLSimulateResponse,
    MLAnomalyResponse,
    MLRecommendRequest,
    MLRecommendResponse,
    RecommendationItem,
)
from ml.models.delay_risk_model import DelayRiskModelService

router = APIRouter(tags=["Machine Learning & AI Risk"])
ml_service = DelayRiskModelService()


@router.post("/predict", response_model=MLPredictResponse)
def predict_activity_risk(request: MLPredictRequest):
    try:
        result = ml_service.predict_risk(request.model_dump())
        return MLPredictResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ML Prediction Error: {exc}") from exc


@router.post("/simulate", response_model=MLSimulateResponse)
def simulate_activity_scenarios(request: MLSimulateRequest):
    try:
        result = ml_service.simulate(
            request.base_input.model_dump(),
            request.manpower_delta_pct,
            request.equipment_availability_delta_pct,
            request.material_availability_delta_pct,
        )
        return MLSimulateResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation Error: {exc}") from exc


@router.post("/anomaly", response_model=MLAnomalyResponse)
def detect_anomaly(request: MLPredictRequest):
    try:
        result = ml_service.predict_risk(request.model_dump())
        return MLAnomalyResponse(
            task_id=request.task_id,
            is_anomalous=result["is_anomalous"],
            anomaly_reasons=result["anomaly_reasons"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Anomaly Detection Error: {exc}") from exc


@router.post("/recommend", response_model=MLRecommendResponse)
def get_recommendations(request: MLRecommendRequest):
    try:
        recs = ml_service.recommend(
            request.predict_result.model_dump(),
            activity_name=request.activity_name or "",
            discipline=request.discipline or "General",
        )
        return MLRecommendResponse(
            recommendations=[RecommendationItem(**item) for item in recs]
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation Error: {exc}") from exc


@router.get("/health")
def ml_health_check():
    return {
        "status": "healthy",
        "service": "SiteFlow ML Microservice",
        "models_loaded": ml_service.classifier is not None and ml_service.regressor is not None,
        "classifier_loaded": ml_service.classifier is not None,
        "regressor_loaded": ml_service.regressor is not None,
        "version": "3.0.0",
    }
