import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.anime import AnimeEntry
from app.schemas.anime import AnimeStatus
from app.schemas.import_schemas import MetadataRefreshResponse, BatchRefreshResponse
from app.services.metadata.factory import get_metadata_provider
from app.services.matching_engine import TitleMatchingEngine

logger = logging.getLogger(__name__)


class MetadataRefreshService:
    @staticmethod
    async def refresh_anime_entry(db: Session, anime: AnimeEntry) -> MetadataRefreshResponse:
        """
        Refresh a single anime entry's metadata from the configured provider.
        Enforces non-destructive update: never decreases user watched episodes.
        """
        provider = get_metadata_provider()
        prev_total = anime.total_episodes
        provider_media_id = anime.provider_media_id

        # 1. Discover provider_media_id if missing
        if not provider_media_id:
            try:
                candidates = await provider.search_anime(anime.title, limit=3)
                best_cand, eval_status, conf, _ = TitleMatchingEngine.evaluate_candidates(anime.title, candidates)
                if best_cand and eval_status == "MATCHED":
                    provider_media_id = best_cand.provider_id
                    anime.provider_media_id = provider_media_id
                    anime.metadata_provider = provider.name
                else:
                    return MetadataRefreshResponse(
                        anime_id=anime.id,
                        title=anime.title,
                        provider=provider.name,
                        provider_media_id=None,
                        previous_total_episodes=prev_total,
                        updated_total_episodes=prev_total,
                        status="NO_MATCH",
                        message="No confident metadata match found for anime title.",
                    )
            except Exception as e:
                logger.error(f"Failed to discover metadata ID for '{anime.title}': {e}")
                return MetadataRefreshResponse(
                    anime_id=anime.id,
                    title=anime.title,
                    provider=provider.name,
                    provider_media_id=None,
                    previous_total_episodes=prev_total,
                    updated_total_episodes=prev_total,
                    status="FAILED",
                    message=f"Metadata search failed: {str(e)}",
                )

        # 2. Fetch anime details
        try:
            details = await provider.get_anime_by_provider_id(provider_media_id)
            if not details:
                anime.metadata_last_checked_at = datetime.now(timezone.utc)
                db.commit()
                return MetadataRefreshResponse(
                    anime_id=anime.id,
                    title=anime.title,
                    provider=provider.name,
                    provider_media_id=provider_media_id,
                    previous_total_episodes=prev_total,
                    updated_total_episodes=prev_total,
                    status="NOT_FOUND",
                    message="Provider media ID not found on remote provider.",
                )

            now = datetime.now(timezone.utc)
            anime.metadata_last_checked_at = now
            status_result = "UNCHANGED"
            msg = "Metadata checked; episode count unchanged."

            # Update poster if missing
            if not anime.poster_url and details.poster_url:
                anime.poster_url = details.poster_url
                anime.metadata_last_updated_at = now

            # Non-destructive episode reconciliation
            if details.total_episodes is not None:
                new_total = details.total_episodes
                if anime.watched_episodes > new_total:
                    # User progress exceeds new total from provider -> conflict detected
                    anime.metadata_sync_status = "CONFLICT_EPISODES"
                    status_result = "CONFLICT"
                    msg = (
                        f"Conflict detected: user has watched {anime.watched_episodes} episodes, "
                        f"but provider reports total {new_total}. Progress preserved."
                    )
                else:
                    if prev_total != new_total:
                        anime.total_episodes = new_total
                        anime.total_episodes_source = "METADATA_PROVIDER"
                        anime.metadata_sync_status = "CURRENT"
                        anime.metadata_last_updated_at = now
                        status_result = "UPDATED"
                        msg = f"Updated total episodes from {prev_total} to {new_total}."
                    else:
                        anime.metadata_sync_status = "CURRENT"

            db.commit()
            db.refresh(anime)

            return MetadataRefreshResponse(
                anime_id=anime.id,
                title=anime.title,
                provider=provider.name,
                provider_media_id=provider_media_id,
                previous_total_episodes=prev_total,
                updated_total_episodes=anime.total_episodes,
                status=status_result,
                message=msg,
            )

        except Exception as e:
            logger.error(f"Error fetching details for anime '{anime.title}': {e}")
            return MetadataRefreshResponse(
                anime_id=anime.id,
                title=anime.title,
                provider=provider.name,
                provider_media_id=provider_media_id,
                previous_total_episodes=prev_total,
                updated_total_episodes=prev_total,
                status="FAILED",
                message=f"Metadata details lookup failed: {str(e)}",
            )

    @staticmethod
    async def batch_refresh_metadata(db: Session, limit: int = 50) -> BatchRefreshResponse:
        """
        Batch refresh eligible anime entries (e.g. ongoing series / watching / planned).
        Prioritizes entries that haven't been checked recently.
        """
        entries = (
            db.query(AnimeEntry)
            .filter(
                AnimeEntry.provider_media_id.isnot(None),
                AnimeEntry.status.in_([AnimeStatus.WATCHING.value, AnimeStatus.PLANNED.value, AnimeStatus.PAUSED.value])
            )
            .order_by(AnimeEntry.metadata_last_checked_at.asc().nullsfirst())
            .limit(limit)
            .all()
        )

        results: List[MetadataRefreshResponse] = []
        updated_count = 0
        conflict_count = 0
        failed_count = 0

        for entry in entries:
            res = await MetadataRefreshService.refresh_anime_entry(db, entry)
            results.append(res)
            if res.status == "UPDATED":
                updated_count += 1
            elif res.status == "CONFLICT":
                conflict_count += 1
            elif res.status == "FAILED":
                failed_count += 1

            # Respect rate-limiting with brief 150ms backoff
            await asyncio.sleep(0.15)

        return BatchRefreshResponse(
            processed_count=len(entries),
            updated_count=updated_count,
            conflict_count=conflict_count,
            failed_count=failed_count,
            results=results,
        )
