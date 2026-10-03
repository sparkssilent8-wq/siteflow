import datetime
from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text
from backend.database.database import Base


class IndiaProject(Base):
    __tablename__ = "india_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    location = Column(String(255), nullable=False, index=True)
    status = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    key_facts = Column(JSON, nullable=False, default=list)
    official_source_url = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    last_verified_at = Column(DateTime, nullable=True)
    source_note = Column(Text, nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)