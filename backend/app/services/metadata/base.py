from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ProviderAnimeCandidate(BaseModel):
    provider: str
    provider_id: str
    title: str
    canonical_title: str
    english_title: Optional[str] = None
    romaji_title: Optional[str] = None
    japanese_title: Optional[str] = None
    all_titles: List[str] = Field(default_factory=list)
    poster_url: Optional[str] = None
    total_episodes: Optional[int] = None
    status: Optional[str] = None
    media_type: Optional[str] = None  # TV, movie, OVA, etc.
    genres: List[str] = Field(default_factory=list)
    year: Optional[int] = None
    source_url: Optional[str] = None


class ProviderAnimeDetails(BaseModel):
    provider: str
    provider_id: str
    title: str
    canonical_title: str
    english_title: Optional[str] = None
    romaji_title: Optional[str] = None
    japanese_title: Optional[str] = None
    all_titles: List[str] = Field(default_factory=list)
    poster_url: Optional[str] = None
    total_episodes: Optional[int] = None
    status: Optional[str] = None
    media_type: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    year: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    synopsis: Optional[str] = None
    source_url: Optional[str] = None
    raw_payload: Dict[str, Any] = Field(default_factory=dict)


class BaseMetadataProvider(ABC):
    """Abstract interface defining operations for anime metadata discovery and enrichment."""

    name: str = "base"

    @abstractmethod
    async def search_anime(self, query: str, limit: int = 5) -> List[ProviderAnimeCandidate]:
        """Search provider for anime candidates matching query string."""
        pass

    @abstractmethod
    async def get_anime_by_provider_id(self, provider_id: str) -> Optional[ProviderAnimeDetails]:
        """Fetch detailed information for a specific anime by provider ID."""
        pass

    @abstractmethod
    def normalize_metadata(self, raw_data: dict) -> ProviderAnimeDetails:
        """Translate raw provider payload into standardized ProviderAnimeDetails."""
        pass

    @abstractmethod
    def retrieve_available_artwork(self, details: ProviderAnimeDetails) -> Optional[str]:
        """Extract primary verified poster artwork URL from details."""
        pass

    @abstractmethod
    def retrieve_episode_information(self, details: ProviderAnimeDetails) -> Optional[int]:
        """Extract verified total episode count from details (returns None if unknown/ongoing)."""
        pass
