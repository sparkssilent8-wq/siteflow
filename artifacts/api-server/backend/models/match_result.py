import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    site_update_id = Column(Integer, ForeignKey("site_updates.id"), nullable=False, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False, index=True)
    confidence_score = Column(Float, nullable=False) # 0.0 to 1.0
    match_method = Column(String(100), default="HYBRID_TFIDF")
    score_breakdown = Column(Text, nullable=True) # JSON string
    top_keywords = Column(Text, nullable=True) # JSON string
    requires_review = Column(Boolean, default=True)
    rank = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    site_update = relationship("SiteUpdate", back_populates="match_results")
    activity = relationship("Activity", back_populates="match_results")
