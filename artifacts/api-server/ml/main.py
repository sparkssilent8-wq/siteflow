import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml.api.ml_router import router as ml_router

load_dotenv()

app = FastAPI(
    title="SiteFlow ML Microservice",
    description="Independent ML service for delay prediction, anomaly detection, what-if simulation and recommendations.",
    version="3.0.0",
)

allowed_origins = [
    item.strip()
    for item in os.getenv("ML_ALLOWED_ORIGINS", os.getenv("BACKEND_ORIGIN", "http://127.0.0.1:8000")).split(",")
    if item.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ml_router)


@app.get("/")
def root():
    return {
        "service": "SiteFlow ML Microservice",
        "status": "operational",
        "docs": "/docs",
        "endpoints": ["/predict", "/simulate", "/anomaly", "/recommend", "/health"],
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "SiteFlow ML Microservice"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.main:app", host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "8001")), reload=False)
