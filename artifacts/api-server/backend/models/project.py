import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from backend.database.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    client = Column(String(255), nullable=True)
    contractor = Column(String(255), nullable=True)
    baseline_start = Column(DateTime, nullable=True)
    baseline_finish = Column(DateTime, nullable=True)
    current_snapshot_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="ACTIVE") # ACTIVE, ON_HOLD, COMPLETED
    overall_planned_progress = Column(Float, default=0.0)
    overall_actual_progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    site_updates = relationship("SiteUpdate", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
