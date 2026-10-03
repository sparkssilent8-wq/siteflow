import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    activity_code = Column(String(100), nullable=False, index=True)
    activity_name = Column(String(255), nullable=False)
    wbs_code = Column(String(100), nullable=True, index=True) # e.g. 1.2.3.4.5
    wbs_level = Column(String(20), default="L5", index=True) # L1, L2, L3, L4, L5, L6
    discipline = Column(String(100), default="General", index=True) # Civil, Piping, Mechanical, Electrical, HSE
    
    planned_start = Column(DateTime, nullable=True)
    planned_finish = Column(DateTime, nullable=True)
    planned_duration = Column(Integer, default=1) # in days
    predecessor = Column(String(255), nullable=True)
    
    actual_start = Column(DateTime, nullable=True)
    actual_finish = Column(DateTime, nullable=True)
    
    planned_progress = Column(Float, default=0.0) # 0 to 100
    actual_progress = Column(Float, default=0.0) # 0 to 100
    progress_variance = Column(Float, default=0.0) # actual - planned
    schedule_variance_days = Column(Float, default=0.0) # negative = delayed
    
    status = Column(String(50), default="NOT_STARTED") # NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, AT_RISK
    risk_level = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    contractor_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="activities")
    progress_updates = relationship("ProgressUpdate", back_populates="activity", cascade="all, delete-orphan")
    match_results = relationship("MatchResult", back_populates="activity")
    risk_predictions = relationship("RiskPrediction", back_populates="activity", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="activity", cascade="all, delete-orphan")
