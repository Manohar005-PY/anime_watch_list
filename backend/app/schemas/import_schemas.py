from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.anime import AnimeStatus
from app.services.metadata.base import ProviderAnimeCandidate


class ParsedImportRow(BaseModel):
    raw_title: str
    status: AnimeStatus = AnimeStatus.PLANNED
    watched_episodes: int = 0
    total_episodes: Optional[int] = None
    rating: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None


class ParseImportRequest(BaseModel):
    text_content: Optional[str] = None
    file_type: str = "text"  # "text" or "csv"


class ParseImportResponse(BaseModel):
    total_rows: int
    preview_items: List[ParsedImportRow]
    errors: List[str] = []


class CreateImportJobRequest(BaseModel):
    source_type: str = "PASTE"  # "PASTE", "TXT", "CSV"
    items: List[ParsedImportRow]


class ImportItemUpdate(BaseModel):
    selected_provider_id: Optional[str] = None
    user_title: Optional[str] = None
    user_status: Optional[AnimeStatus] = None
    watched_episodes: Optional[int] = None
    total_episodes: Optional[int] = None
    rating: Optional[int] = None
    skip: Optional[bool] = None


class DuplicateActionMap(BaseModel):
    # item_id -> "skip" | "update_metadata" | "merge_progress"
    actions: Dict[str, str] = Field(default_factory=dict)


class ImportJobItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    raw_title: str
    parsed_status: str
    parsed_watched_episodes: int
    parsed_rating: Optional[int] = None
    parsed_notes: Optional[str] = None
    status: str
    matched_title: Optional[str] = None
    matched_alternate_title: Optional[str] = None
    provider_media_id: Optional[str] = None
    poster_url: Optional[str] = None
    total_episodes: Optional[int] = None
    match_confidence: float
    match_warning: Optional[str] = None
    candidates_json: List[Dict[str, Any]] = []
    is_duplicate: bool
    existing_anime_id: Optional[str] = None
    error_message: Optional[str] = None


class ImportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    source_type: str
    status: str
    total_items: int
    matched_items: int
    imported_items: int
    skipped_items: int
    failed_items: int
    items: List[ImportJobItemResponse] = []
    created_at: Any
    updated_at: Any


class MetadataRefreshResponse(BaseModel):
    anime_id: str
    title: str
    provider: str
    provider_media_id: Optional[str] = None
    previous_total_episodes: Optional[int] = None
    updated_total_episodes: Optional[int] = None
    status: str
    message: str


class BatchRefreshResponse(BaseModel):
    processed_count: int
    updated_count: int
    conflict_count: int
    failed_count: int
    results: List[MetadataRefreshResponse] = []
