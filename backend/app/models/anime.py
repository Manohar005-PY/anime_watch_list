import re
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, Date,
    ForeignKey, UniqueConstraint, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def normalize_title(title: str) -> str:
    """Normalize title for duplicate comparison within user scope."""
    if not title:
        return ""
    # Lowercase, replace multiple spaces/special chars with a single space
    cleaned = re.sub(r"[^\w\s]", "", title.lower())
    return " ".join(cleaned.split())


class AnimeEntry(Base):
    __tablename__ = "anime_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title = Column(String(255), nullable=False)
    normalized_title = Column(String(255), nullable=False, index=True)
    alternate_title = Column(String(255), nullable=True)
    poster_url = Column(String(1000), nullable=True)
    status = Column(String(20), nullable=False, default="PLANNED", index=True)
    
    total_episodes = Column(Integer, nullable=True)
    watched_episodes = Column(Integer, default=0, nullable=False)
    rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False, index=True)
    genres = Column(JSON, default=list, nullable=False)
    
    started_at = Column(Date, nullable=True)
    completed_at = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    user = relationship("User", back_populates="anime_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "normalized_title", name="uq_user_normalized_title"),
        CheckConstraint("watched_episodes >= 0", name="chk_watched_episodes_positive"),
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 10)", name="chk_rating_range"),
    )
