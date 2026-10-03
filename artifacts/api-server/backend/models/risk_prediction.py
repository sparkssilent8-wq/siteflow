import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False, index=True)
    predicted_remaining_days = Column(Float, nullable=False)
    prediction_interval_80pct = Column(String(100), nullable=True) # "min_days - max_days"
    expected_completion_in_days = Column(Float, nullable=True)
    delay_probability = Column(Float, nullable=False) # 0.0 to 1.0
    risk_category = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    risk_score_0_100 = Column(Float, nullable=False)
    is_anomalous = Column(Boolean, default=False)
    anomaly_reasons = Column(Text, nullable=True) # JSON array string
    explanation = Column(Text, nullable=True)
    factor_contributions = Column(Text, nullable=True) # JSON object string
    model_confidence_note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    activity = relationship("Activity", back_populates="risk_predictions")
