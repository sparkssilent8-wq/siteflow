import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False, index=True)
    progress_percentage = Column(Float, nullable=False)
    previous_percentage = Column(Float, default=0.0)
    status = Column(String(50), nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_finish = Column(DateTime, nullable=True)
    source = Column(String(100), default="SITE_UPDATE") # SITE_UPDATE, MANUAL_OVERRIDE, DPR_IMPORT
    confidence = Column(Float, default=1.0)
    remarks = Column(Text, nullable=True)
    site_update_id = Column(Integer, ForeignKey("site_updates.id"), nullable=True)
    reviewer_name = Column(String(100), default="Site Supervisor")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    activity = relationship("Activity", back_populates="progress_updates")
    site_update = relationship("SiteUpdate", back_populates="progress_record")
