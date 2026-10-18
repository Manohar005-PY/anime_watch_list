from typing import Dict, List, Optional
from pydantic import BaseModel
from app.schemas.anime import AnimeResponse


class UserStatsResponse(BaseModel):
    total_titles: int
    watching_count: int
    completed_count: int
    planned_count: int
    paused_count: int
    dropped_count: int
    total_episodes_watched: int
    completion_rate: float
    mean_rating: Optional[float] = None
    ratings_distribution: Dict[int, int]
    status_distribution: Dict[str, int]
    genre_distribution: Dict[str, int]
    recent_updates: List[AnimeResponse]
    favorite_titles: List[AnimeResponse]


class PersonalDataExport(BaseModel):
    user_id: str
    email: str
    exported_at: str
    total_entries: int
    preferences: Dict
    entries: List[AnimeResponse]
