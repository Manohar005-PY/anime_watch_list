from datetime import date, datetime, timezone
import math
from typing import Optional, List, Tuple
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.anime import AnimeEntry, normalize_title
from app.schemas.anime import (
    AnimeCreateRequest,
    AnimeUpdateRequest,
    AnimeStatus,
    AnimeListResponse,
    AnimeResponse,
)


class AnimeService:
    @staticmethod
    def get_anime_by_id(db: Session, anime_id: str, user_id: str) -> AnimeEntry:
        """Retrieve single anime strictly scoped to authenticated user."""
        entry = (
            db.query(AnimeEntry)
            .filter(AnimeEntry.id == anime_id, AnimeEntry.user_id == user_id)
            .first()
        )
        if not entry:
            # Always return 404 to avoid disclosing whether another user's entry exists
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anime entry not found in your collection."
            )
        return entry

    @staticmethod
    def list_anime(
        db: Session,
        user_id: str,
        status_filter: Optional[AnimeStatus] = None,
        rating_filter: Optional[int] = None,
        is_favorite_filter: Optional[bool] = None,
        genre_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 24
    ) -> AnimeListResponse:
        """List anime entries strictly scoped to authenticated user with pagination and filtering."""
        query = db.query(AnimeEntry).filter(AnimeEntry.user_id == user_id)

        # Filters
        if status_filter:
            query = query.filter(AnimeEntry.status == status_filter.value)
        if rating_filter is not None:
            query = query.filter(AnimeEntry.rating == rating_filter)
        if is_favorite_filter is not None:
            query = query.filter(AnimeEntry.is_favorite == is_favorite_filter)
        if search_query and search_query.strip():
            term = f"%{search_query.strip().lower()}%"
            query = query.filter(
                or_(
                    AnimeEntry.title.ilike(term),
                    AnimeEntry.alternate_title.ilike(term),
                    AnimeEntry.normalized_title.ilike(term)
                )
            )

        # Sorting allowlist
        allowed_sort_fields = {
            "title": AnimeEntry.title,
            "created_at": AnimeEntry.created_at,
            "updated_at": AnimeEntry.updated_at,
            "rating": AnimeEntry.rating,
            "watched_episodes": AnimeEntry.watched_episodes,
            "status": AnimeEntry.status,
        }
        sort_column = allowed_sort_fields.get(sort_by, AnimeEntry.updated_at)
        order_fn = desc if sort_order.lower() == "desc" else asc
        query = query.order_by(order_fn(sort_column))

        # Efficient database pagination
        if genre_filter and genre_filter.strip():
            # In-memory genre filter for universal SQLite and Postgres JSON array compatibility
            all_results = query.all()
            g_target = genre_filter.strip().lower()
            filtered_results = [
                e for e in all_results
                if any(g.lower() == g_target for g in (e.genres or []))
            ]
            total = len(filtered_results)
            total_pages = math.ceil(total / page_size) if total > 0 else 0
            offset = (page - 1) * page_size
            paginated_items = filtered_results[offset : offset + page_size]
        else:
            # Native database COUNT and LIMIT/OFFSET avoiding full table load into memory
            total = query.order_by(None).count()
            total_pages = math.ceil(total / page_size) if total > 0 else 0
            offset = (page - 1) * page_size
            paginated_items = query.offset(offset).limit(page_size).all()

        return AnimeListResponse(
            items=[AnimeResponse.model_validate(item) for item in paginated_items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    @staticmethod
    def create_anime(db: Session, request: AnimeCreateRequest, user_id: str) -> AnimeEntry:
        """Create new anime entry in authenticated user's library with duplicate checking."""
        norm_title = normalize_title(request.title)
        
        # Check duplicate for this user
        existing = (
            db.query(AnimeEntry)
            .filter(AnimeEntry.user_id == user_id, AnimeEntry.normalized_title == norm_title)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An entry titled '{request.title}' already exists in your library."
            )

        # Auto-set dates based on status
        started = request.started_at
        completed = request.completed_at
        today = date.today()

        if request.status == AnimeStatus.WATCHING and not started:
            started = today
        elif request.status == AnimeStatus.COMPLETED:
            if not started:
                started = today
            if not completed:
                completed = today
            # If total_episodes is known and watched_episodes was 0, default to all watched
            if request.total_episodes and request.watched_episodes == 0:
                request.watched_episodes = request.total_episodes

        entry = AnimeEntry(
            user_id=user_id,
            title=request.title.strip(),
            normalized_title=norm_title,
            alternate_title=request.alternate_title.strip() if request.alternate_title else None,
            poster_url=request.poster_url,
            status=request.status.value,
            total_episodes=request.total_episodes,
            watched_episodes=request.watched_episodes,
            rating=request.rating,
            notes=request.notes.strip() if request.notes else None,
            is_favorite=request.is_favorite,
            genres=request.genres,
            started_at=started,
            completed_at=completed
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def update_anime(
        db: Session,
        anime_id: str,
        request: AnimeUpdateRequest,
        user_id: str
    ) -> AnimeEntry:
        """Update anime entry fields with ownership scoping and duplicate protection."""
        entry = AnimeService.get_anime_by_id(db, anime_id, user_id)

        # If title is changing, check for duplicates
        if request.title and request.title.strip() != entry.title:
            new_norm = normalize_title(request.title)
            conflict = (
                db.query(AnimeEntry)
                .filter(
                    AnimeEntry.user_id == user_id,
                    AnimeEntry.normalized_title == new_norm,
                    AnimeEntry.id != anime_id
                )
                .first()
            )
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another entry titled '{request.title}' already exists in your library."
                )
            entry.title = request.title.strip()
            entry.normalized_title = new_norm

        if request.alternate_title is not None:
            entry.alternate_title = request.alternate_title.strip() if request.alternate_title else None

        if request.poster_url is not None:
            entry.poster_url = request.poster_url

        # Validate episodes relation
        new_total = request.total_episodes if request.total_episodes is not None else entry.total_episodes
        new_watched = request.watched_episodes if request.watched_episodes is not None else entry.watched_episodes
        if new_total is not None and new_watched > new_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Watched episodes ({new_watched}) cannot exceed total episodes ({new_total})."
            )

        if request.total_episodes is not None:
            entry.total_episodes = request.total_episodes
        if request.watched_episodes is not None:
            entry.watched_episodes = request.watched_episodes

        if request.status is not None:
            entry.status = request.status.value
            today = date.today()
            if request.status == AnimeStatus.COMPLETED and not entry.completed_at:
                entry.completed_at = today
            elif request.status == AnimeStatus.WATCHING and not entry.started_at:
                entry.started_at = today

        if request.rating is not None:
            entry.rating = request.rating

        if request.notes is not None:
            entry.notes = request.notes.strip() if request.notes else None

        if request.is_favorite is not None:
            entry.is_favorite = request.is_favorite

        if request.genres is not None:
            entry.genres = request.genres

        if request.started_at is not None:
            entry.started_at = request.started_at

        if request.completed_at is not None:
            entry.completed_at = request.completed_at

        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def update_progress(db: Session, anime_id: str, watched_episodes: int, user_id: str) -> AnimeEntry:
        """Update watched episode count with auto-completion handling."""
        entry = AnimeService.get_anime_by_id(db, anime_id, user_id)
        
        if entry.total_episodes is not None and watched_episodes > entry.total_episodes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Watched episodes ({watched_episodes}) cannot exceed total episodes ({entry.total_episodes})."
            )

        entry.watched_episodes = watched_episodes
        today = date.today()

        # If completed all episodes, auto-set status to COMPLETED
        if entry.total_episodes is not None and watched_episodes == entry.total_episodes:
            entry.status = AnimeStatus.COMPLETED.value
            if not entry.completed_at:
                entry.completed_at = today
        elif watched_episodes > 0 and entry.status == AnimeStatus.PLANNED.value:
            entry.status = AnimeStatus.WATCHING.value
            if not entry.started_at:
                entry.started_at = today

        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def update_status(db: Session, anime_id: str, new_status: AnimeStatus, user_id: str) -> AnimeEntry:
        """Update status with automatic episode completion or date syncing."""
        entry = AnimeService.get_anime_by_id(db, anime_id, user_id)
        entry.status = new_status.value
        today = date.today()

        if new_status == AnimeStatus.COMPLETED:
            if not entry.completed_at:
                entry.completed_at = today
            if entry.total_episodes and entry.watched_episodes < entry.total_episodes:
                entry.watched_episodes = entry.total_episodes
        elif new_status == AnimeStatus.WATCHING:
            if not entry.started_at:
                entry.started_at = today

        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def toggle_favorite(db: Session, anime_id: str, user_id: str) -> AnimeEntry:
        """Toggle favorite flag on anime entry."""
        entry = AnimeService.get_anime_by_id(db, anime_id, user_id)
        entry.is_favorite = not entry.is_favorite
        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def delete_anime(db: Session, anime_id: str, user_id: str) -> None:
        """Delete anime entry with strict ownership check."""
        entry = AnimeService.get_anime_by_id(db, anime_id, user_id)
        db.delete(entry)
        db.commit()
