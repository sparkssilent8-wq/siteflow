import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class SiteUpdate(Base):
    __tablename__ = "site_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    progress_pct = Column(Float, nullable=True)
    status = Column(String(50), nullable=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    remarks = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    contractor = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    report_file_url = Column(String(500), nullable=True)
    
    matched_activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    match_confidence = Column(Float, default=0.0) # 0.0 to 1.0
    match_method = Column(String(100), default="HYBRID_TFIDF")
    
    review_status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, REASSIGNED

    # Time Agent audit trail
    source = Column(String(50), default="MANUAL")
    event_type = Column(String(50), nullable=True)
    voice_transcript = Column(Text, nullable=True)
    extracted_activity = Column(Text, nullable=True)
    extracted_discipline = Column(String(100), nullable=True)
    actual_event_time = Column(DateTime, nullable=True)
    extraction_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="site_updates")
    matched_activity = relationship("Activity")
    match_results = relationship("MatchResult", back_populates="site_update", cascade="all, delete-orphan")
    review_decision = relationship("ReviewDecision", back_populates="site_update", uselist=False, cascade="all, delete-orphan")
    progress_record = relationship("ProgressUpdate", back_populates="site_update", uselist=False)
