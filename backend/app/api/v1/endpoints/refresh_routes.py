from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.anime import AnimeEntry
from app.schemas.import_schemas import MetadataRefreshResponse, BatchRefreshResponse
from app.services.refresh_service import MetadataRefreshService

router = APIRouter()


@router.post("/anime/{anime_id}/refresh", response_model=MetadataRefreshResponse)
async def refresh_single_anime(
    anime_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger metadata refresh for a specific user anime entry."""
    anime = db.query(AnimeEntry).filter(
        AnimeEntry.id == anime_id,
        AnimeEntry.user_id == current_user.id,
    ).first()
    if not anime:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anime entry not found")

    return await MetadataRefreshService.refresh_anime_entry(db, anime)


@router.post("/metadata/refresh/batch", response_model=BatchRefreshResponse)
async def batch_refresh_metadata(
    limit: int = Query(50, ge=1, le=100),
    x_scheduler_token: Optional[str] = Header(None, alias="X-Scheduler-Token"),
    db: Session = Depends(get_db),
):
    """
    Scheduled batch refresh endpoint for background cron or Cloud Scheduler.
    Guarded by X-Scheduler-Token matching server configuration.
    """
    expected_token = settings.SCHEDULER_SECRET_TOKEN
    if not expected_token or x_scheduler_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing scheduler secret token.",
        )

    return await MetadataRefreshService.batch_refresh_metadata(db=db, limit=limit)
