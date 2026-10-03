import atexit
import os
import tempfile
from pathlib import Path


# Tests use a private throwaway SQLite database. This keeps the checked-in
# development database and any user data untouched while preserving the real
# SQLAlchemy and API wiring.
TEST_DB = Path(tempfile.gettempdir()) / f"siteflow-pytest-{os.getpid()}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["SITEFLOW_SKIP_SAMPLE_FILES"] = "1"

from backend.seed_data import seed_database
from backend.services.ml_client import ml_client
from ml.models.delay_risk_model import DelayRiskModelService


seed_database()
ml_service = DelayRiskModelService()


async def _predict(payload):
    return ml_service.predict_risk(payload)


async def _simulate(payload):
    base_input = payload.get("base_input", payload)
    return ml_service.simulate(
        base_input,
        manpower_delta_pct=payload.get("manpower_delta_pct", 0.0),
        equip_delta_pct=payload.get("equipment_availability_delta_pct", 0.0),
        mat_delta_pct=payload.get("material_availability_delta_pct", 0.0),
    )


async def _anomaly(payload):
    return ml_service.predict_risk(payload)


async def _recommend(payload):
    prediction = payload.get("predict_result", payload)
    return {"recommendations": ml_service.recommend(
        prediction,
        activity_name=payload.get("activity_name", "Activity"),
        discipline=payload.get("discipline", "General"),
    )}


async def _health():
    return {"status": "healthy", "service": "test-model-adapter"}


# Keep endpoint tests deterministic and runnable without a second manually
# started process, while still exercising the real saved ML model code.
ml_client.predict = _predict
ml_client.simulate = _simulate
ml_client.anomaly = _anomaly
ml_client.recommend = _recommend
ml_client.health = _health


@atexit.register
def cleanup_test_database():
    for suffix in ("", "-journal", "-wal", "-shm"):
        try:
            Path(f"{TEST_DB}{suffix}").unlink()
        except FileNotFoundError:
            pass