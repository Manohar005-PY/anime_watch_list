import ipaddress
from datetime import date, datetime
from enum import Enum
from typing import Optional, List
from urllib.parse import urlparse
from pydantic import BaseModel, Field, model_validator, ConfigDict


class AnimeStatus(str, Enum):
    WATCHING = "WATCHING"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"
    DROPPED = "DROPPED"
    PLANNED = "PLANNED"


def validate_safe_poster_url(url: Optional[str]) -> Optional[str]:
    """Validate poster URL against SSRF and ensure https scheme."""
    if not url:
        return None
    url = url.strip()
    if not url:
        return None
    
    parsed = urlparse(url)
    if parsed.scheme.lower() != "https":
        raise ValueError("Poster URL must use https protocol.")
    
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL hostname.")
    
    # Check for localhost / loopback
    if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
        raise ValueError("Private network and metadata hostnames are forbidden.")
    
    # Check for private IP literals
    is_ip = False
    try:
        ip = ipaddress.ip_address(hostname)
        is_ip = True
    except ValueError:
        # Not an IP literal, it is a regular domain name
        pass

    if is_ip and (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved):
        raise ValueError("Private and link-local IP addresses are forbidden.")

    return url


class AnimeCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    alternate_title: Optional[str] = Field(default=None, max_length=255)
    poster_url: Optional[str] = Field(default=None, max_length=1000)
    status: AnimeStatus = Field(default=AnimeStatus.PLANNED)
    total_episodes: Optional[int] = Field(default=None, ge=1)
    watched_episodes: int = Field(default=0, ge=0)
    rating: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = Field(default=None, max_length=5000)
    is_favorite: bool = Field(default=False)
    genres: List[str] = Field(default_factory=list)
    started_at: Optional[date] = None
    completed_at: Optional[date] = None

    @model_validator(mode="after")
    def validate_episodes_and_url(self):
        if self.poster_url:
            self.poster_url = validate_safe_poster_url(self.poster_url)
        if self.total_episodes is not None and self.watched_episodes > self.total_episodes:
            raise ValueError(
                f"Watched episodes ({self.watched_episodes}) cannot exceed total episodes ({self.total_episodes})."
            )
        # Clean genres list
        if self.genres:
            cleaned = [g.strip() for g in self.genres if g and g.strip()]
            self.genres = list(dict.fromkeys(cleaned))[:20]
        return self


class AnimeUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    alternate_title: Optional[str] = Field(default=None, max_length=255)
    poster_url: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[AnimeStatus] = None
    total_episodes: Optional[int] = Field(default=None, ge=1)
    watched_episodes: Optional[int] = Field(default=None, ge=0)
    rating: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = Field(default=None, max_length=5000)
    is_favorite: Optional[bool] = None
    genres: Optional[List[str]] = None
    started_at: Optional[date] = None
    completed_at: Optional[date] = None

    @model_validator(mode="after")
    def validate_update(self):
        if self.poster_url:
            self.poster_url = validate_safe_poster_url(self.poster_url)
        if self.genres is not None:
            cleaned = [g.strip() for g in self.genres if g and g.strip()]
            self.genres = list(dict.fromkeys(cleaned))[:20]
        return self


class AnimeProgressUpdateRequest(BaseModel):
    watched_episodes: int = Field(ge=0)


class AnimeStatusUpdateRequest(BaseModel):
    status: AnimeStatus


class AnimeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    normalized_title: str
    alternate_title: Optional[str] = None
    poster_url: Optional[str] = None
    status: AnimeStatus
    total_episodes: Optional[int] = None
    watched_episodes: int
    rating: Optional[int] = None
    notes: Optional[str] = None
    is_favorite: bool
    genres: List[str] = []
    started_at: Optional[date] = None
    completed_at: Optional[date] = None
    created_at: datetime
    updated_at: datetime


class AnimeListResponse(BaseModel):
    items: List[AnimeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
