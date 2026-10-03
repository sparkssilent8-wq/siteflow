import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    site_update_id = Column(Integer, ForeignKey("site_updates.id"), nullable=False, unique=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=True)
    decision = Column(String(50), nullable=False) # APPROVED, REJECTED, REASSIGNED
    previous_status = Column(String(50), default="PENDING")
    reviewer_name = Column(String(100), default="Project Manager")
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    site_update = relationship("SiteUpdate", back_populates="review_decision")
    activity = relationship("Activity")
