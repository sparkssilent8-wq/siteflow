import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    priority = Column(String(50), default="MEDIUM") # HIGH, MEDIUM, LOW
    rationale = Column(Text, nullable=False) # WHY
    impact = Column(Text, nullable=False) # IMPACT
    action_steps = Column(Text, nullable=True) # JSON string or Markdown
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    activity = relationship("Activity", back_populates="recommendations")
