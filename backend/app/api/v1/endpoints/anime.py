from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.anime import (
    AnimeCreateRequest,
    AnimeUpdateRequest,
    AnimeProgressUpdateRequest,
    AnimeStatusUpdateRequest,
    AnimeResponse,
    AnimeListResponse,
    AnimeStatus,
)
from app.schemas.common import MessageResponse
from app.services.anime_service import AnimeService

router = APIRouter()


@router.get("", response_model=AnimeListResponse)
def list_anime(
    status: Optional[AnimeStatus] = Query(None, description="Filter by watch status"),
    rating: Optional[int] = Query(None, ge=1, le=10, description="Filter by exact rating"),
    is_favorite: Optional[bool] = Query(None, description="Filter by favorite flag"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    q: Optional[str] = Query(None, description="Search query across titles"),
    sort_by: str = Query("updated_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(24, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List anime entries strictly scoped to the authenticated user."""
    return AnimeService.list_anime(
        db=db,
        user_id=current_user.id,
        status_filter=status,
        rating_filter=rating,
        is_favorite_filter=is_favorite,
        genre_filter=genre,
        search_query=q,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=AnimeResponse, status_code=status.HTTP_201_CREATED)
def create_anime(
    request_data: AnimeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new anime entry to the authenticated user's library."""
    entry = AnimeService.create_anime(db=db, request=request_data, user_id=current_user.id)
    return AnimeResponse.model_validate(entry)


@router.get("/{anime_id}", response_model=AnimeResponse)
def get_anime_detail(
    anime_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details for a single anime owned by the authenticated user."""
    entry = AnimeService.get_anime_by_id(db=db, anime_id=anime_id, user_id=current_user.id)
    return AnimeResponse.model_validate(entry)


@router.put("/{anime_id}", response_model=AnimeResponse)
def update_anime(
    anime_id: str,
    request_data: AnimeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update fields on an existing anime entry owned by the authenticated user."""
    entry = AnimeService.update_anime(
        db=db,
        anime_id=anime_id,
        request=request_data,
        user_id=current_user.id
    )
    return AnimeResponse.model_validate(entry)


@router.patch("/{anime_id}/progress", response_model=AnimeResponse)
def update_anime_progress(
    anime_id: str,
    request_data: AnimeProgressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update episode progress with automatic completion transitions."""
    entry = AnimeService.update_progress(
        db=db,
        anime_id=anime_id,
        watched_episodes=request_data.watched_episodes,
        user_id=current_user.id
    )
    return AnimeResponse.model_validate(entry)


@router.patch("/{anime_id}/status", response_model=AnimeResponse)
def update_anime_status(
    anime_id: str,
    request_data: AnimeStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update watch status with automatic episode completion or date synchronization."""
    entry = AnimeService.update_status(
        db=db,
        anime_id=anime_id,
        new_status=request_data.status,
        user_id=current_user.id
    )
    return AnimeResponse.model_validate(entry)


@router.post("/{anime_id}/toggle-favorite", response_model=AnimeResponse)
def toggle_favorite(
    anime_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status on a user-owned anime entry."""
    entry = AnimeService.toggle_favorite(db=db, anime_id=anime_id, user_id=current_user.id)
    return AnimeResponse.model_validate(entry)


@router.delete("/{anime_id}", response_model=MessageResponse)
def delete_anime(
    anime_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an anime entry owned by the authenticated user."""
    AnimeService.delete_anime(db=db, anime_id=anime_id, user_id=current_user.id)
    return MessageResponse(message="Anime entry successfully deleted.")
