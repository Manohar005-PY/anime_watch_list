import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    source_type = Column(String(20), nullable=False, default="PASTE")  # PASTE, TXT, CSV
    status = Column(String(20), nullable=False, default="PENDING", index=True)  # PENDING, PROCESSING, REVIEW, COMPLETED, FAILED, CANCELLED
    
    total_items = Column(Integer, default=0, nullable=False)
    matched_items = Column(Integer, default=0, nullable=False)
    imported_items = Column(Integer, default=0, nullable=False)
    skipped_items = Column(Integer, default=0, nullable=False)
    failed_items = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user = relationship("User")
    items = relationship("ImportJobItem", back_populates="job", cascade="all, delete-orphan", order_by="ImportJobItem.created_at")


class ImportJobItem(Base):
    __tablename__ = "import_job_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("import_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    
    raw_title = Column(String(255), nullable=False)
    parsed_status = Column(String(20), default="PLANNED", nullable=False)
    parsed_watched_episodes = Column(Integer, default=0, nullable=False)
    parsed_rating = Column(Integer, nullable=True)
    parsed_notes = Column(Text, nullable=True)
    
    # Matching outcome
    status = Column(String(20), default="PENDING", nullable=False, index=True)
    # PENDING, MATCHED, AMBIGUOUS, UNMATCHED, DUPLICATE, IMPORTED, SKIPPED, FAILED
    
    matched_title = Column(String(255), nullable=True)
    matched_alternate_title = Column(String(255), nullable=True)
    provider_media_id = Column(String(100), nullable=True)
    poster_url = Column(String(1000), nullable=True)
    total_episodes = Column(Integer, nullable=True)
    
    match_confidence = Column(Float, default=0.0, nullable=False)
    match_warning = Column(String(255), nullable=True)
    candidates_json = Column(JSON, default=list, nullable=False)
    
    is_duplicate = Column(Boolean, default=False, nullable=False)
    existing_anime_id = Column(String(36), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    job = relationship("ImportJob", back_populates="items")
