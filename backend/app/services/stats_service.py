from collections import Counter
from datetime import datetime, timezone
from typing import Dict, List
from sqlalchemy.orm import Session
from app.models.anime import AnimeEntry
from app.models.user import User
from app.schemas.anime import AnimeResponse, AnimeStatus
from app.schemas.stats import UserStatsResponse, PersonalDataExport


class StatsService:
    @staticmethod
    def get_user_stats(db: Session, user_id: str) -> UserStatsResponse:
        """Calculate exact statistics for the authenticated user."""
        entries: List[AnimeEntry] = db.query(AnimeEntry).filter(AnimeEntry.user_id == user_id).all()
        
        total_titles = len(entries)
        watching_count = 0
        completed_count = 0
        planned_count = 0
        paused_count = 0
        dropped_count = 0
        total_episodes_watched = 0
        ratings_sum = 0
        rated_count = 0
        
        ratings_distribution: Dict[int, int] = {i: 0 for i in range(1, 11)}
        status_distribution: Dict[str, int] = {
            AnimeStatus.WATCHING.value: 0,
            AnimeStatus.COMPLETED.value: 0,
            AnimeStatus.PLANNED.value: 0,
            AnimeStatus.PAUSED.value: 0,
            AnimeStatus.DROPPED.value: 0,
        }
        genre_counter: Counter = Counter()

        for e in entries:
            # Status count
            status_val = e.status
            if status_val in status_distribution:
                status_distribution[status_val] += 1
            if status_val == AnimeStatus.WATCHING.value:
                watching_count += 1
            elif status_val == AnimeStatus.COMPLETED.value:
                completed_count += 1
            elif status_val == AnimeStatus.PLANNED.value:
                planned_count += 1
            elif status_val == AnimeStatus.PAUSED.value:
                paused_count += 1
            elif status_val == AnimeStatus.DROPPED.value:
                dropped_count += 1

            # Episodes count
            total_episodes_watched += (e.watched_episodes or 0)

            # Ratings distribution
            if e.rating and 1 <= e.rating <= 10:
                ratings_distribution[e.rating] += 1
                ratings_sum += e.rating
                rated_count += 1

            # Genres
            if e.genres:
                for g in e.genres:
                    if g:
                        genre_counter[g.strip()] += 1

        completion_rate = round((completed_count / total_titles) * 100, 1) if total_titles > 0 else 0.0
        mean_rating = round(ratings_sum / rated_count, 2) if rated_count > 0 else None

        # Recent updates (top 6)
        recent_entries = sorted(entries, key=lambda x: x.updated_at, reverse=True)[:6]
        recent_updates = [AnimeResponse.model_validate(x) for x in recent_entries]

        # Favorites (top 12)
        favorites = [x for x in entries if x.is_favorite]
        favorites_sorted = sorted(
            favorites,
            key=lambda x: (x.rating or 0, x.updated_at),
            reverse=True
        )[:12]
        favorite_titles = [AnimeResponse.model_validate(x) for x in favorites_sorted]

        return UserStatsResponse(
            total_titles=total_titles,
            watching_count=watching_count,
            completed_count=completed_count,
            planned_count=planned_count,
            paused_count=paused_count,
            dropped_count=dropped_count,
            total_episodes_watched=total_episodes_watched,
            completion_rate=completion_rate,
            mean_rating=mean_rating,
            ratings_distribution=ratings_distribution,
            status_distribution=status_distribution,
            genre_distribution=dict(genre_counter.most_common(15)),
            recent_updates=recent_updates,
            favorite_titles=favorite_titles
        )

    @staticmethod
    def export_user_data(db: Session, user: User) -> PersonalDataExport:
        """Export all user records into a structured, validated JSON format."""
        entries = db.query(AnimeEntry).filter(AnimeEntry.user_id == user.id).order_by(AnimeEntry.created_at.asc()).all()
        return PersonalDataExport(
            user_id=user.id,
            email=user.email,
            exported_at=datetime.now(timezone.utc).isoformat(),
            total_entries=len(entries),
            preferences=user.preferences or {},
            entries=[AnimeResponse.model_validate(e) for e in entries]
        )
