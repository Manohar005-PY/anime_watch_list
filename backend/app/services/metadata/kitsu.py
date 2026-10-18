import logging
from typing import Optional, List
import httpx
from app.services.metadata.base import (
    BaseMetadataProvider,
    ProviderAnimeCandidate,
    ProviderAnimeDetails,
)
from app.schemas.anime import validate_safe_poster_url

logger = logging.getLogger("kage.metadata.kitsu")


class KitsuProvider(BaseMetadataProvider):
    """Production provider using Kitsu JSON:API (https://kitsu.io/api/edge)."""

    name: str = "kitsu"
    BASE_URL = "https://kitsu.io/api/edge"
    HEADERS = {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "User-Agent": "KageApp/1.0 (https://kage.app)",
    }

    def __init__(self, timeout: float = 8.0):
        self.timeout = timeout

    async def search_anime(self, query: str, limit: int = 5) -> List[ProviderAnimeCandidate]:
        if not query or not query.strip():
            return []

        url = f"{self.BASE_URL}/anime"
        params = {
            "filter[text]": query.strip(),
            "page[limit]": max(1, min(limit, 10)),
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers=self.HEADERS)
                if response.status_code != 200:
                    logger.warning(f"Kitsu search returned non-200 status {response.status_code} for '{query}'")
                    return []
                
                payload = response.json()
                items = payload.get("data", [])
                candidates = []
                for item in items:
                    details = self.normalize_metadata(item)
                    candidates.append(
                        ProviderAnimeCandidate(
                            provider="kitsu",
                            provider_id=details.provider_id,
                            title=details.title,
                            canonical_title=details.canonical_title,
                            english_title=details.english_title,
                            romaji_title=details.romaji_title,
                            japanese_title=details.japanese_title,
                            all_titles=details.all_titles,
                            poster_url=details.poster_url,
                            total_episodes=details.total_episodes,
                            status=details.status,
                            media_type=details.media_type,
                            genres=details.genres,
                            year=details.year,
                            source_url=details.source_url,
                        )
                    )
                return candidates
        except Exception as exc:
            logger.error(f"Error querying Kitsu search for '{query}': {exc}")
            return []

    async def get_anime_by_provider_id(self, provider_id: str) -> Optional[ProviderAnimeDetails]:
        if not provider_id or not provider_id.strip():
            return None

        url = f"{self.BASE_URL}/anime/{provider_id.strip()}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.HEADERS)
                if response.status_code == 404:
                    return None
                if response.status_code != 200:
                    logger.warning(f"Kitsu get returned status {response.status_code} for id '{provider_id}'")
                    return None
                
                payload = response.json()
                data = payload.get("data")
                if not data:
                    return None
                return self.normalize_metadata(data)
        except Exception as exc:
            logger.error(f"Error fetching Kitsu anime '{provider_id}': {exc}")
            return None

    def normalize_metadata(self, raw_data: dict) -> ProviderAnimeDetails:
        item_id = str(raw_data.get("id", ""))
        attrs = raw_data.get("attributes", {})

        canonical_title = attrs.get("canonicalTitle") or ""
        titles_dict = attrs.get("titles") or {}
        en_title = titles_dict.get("en")
        en_jp_title = titles_dict.get("en_jp")
        ja_jp_title = titles_dict.get("ja_jp")
        abbreviated = attrs.get("abbreviatedTitles") or []

        # Build list of all alternate titles for matching
        all_titles = []
        for t in [canonical_title, en_title, en_jp_title, ja_jp_title] + abbreviated:
            if t and isinstance(t, str) and t.strip() and t.strip() not in all_titles:
                all_titles.append(t.strip())

        # Preferred display title: prefer English or canonical title
        display_title = en_title or canonical_title or (all_titles[0] if all_titles else "Untitled")

        # Poster artwork extraction with SSRF safe validation
        poster_images = attrs.get("posterImage") or {}
        raw_poster = (
            poster_images.get("large")
            or poster_images.get("original")
            or poster_images.get("medium")
            or poster_images.get("small")
        )
        safe_poster_url = None
        if raw_poster:
            try:
                safe_poster_url = validate_safe_poster_url(raw_poster)
            except ValueError:
                safe_poster_url = None

        # Episode count: strictly positive integer or None (never 0 for unknown)
        raw_episodes = attrs.get("episodeCount")
        total_episodes = None
        if raw_episodes is not None and isinstance(raw_episodes, int) and raw_episodes > 0:
            total_episodes = raw_episodes

        # Year from startDate (e.g. "1998-04-03")
        start_date = attrs.get("startDate")
        year = None
        if start_date and len(start_date) >= 4 and start_date[:4].isdigit():
            year = int(start_date[:4])

        status_raw = attrs.get("status")  # current, finished, tba, unreleased, upcoming
        status_map = {
            "current": "Airing",
            "finished": "Completed",
            "tba": "TBA",
            "unreleased": "Unreleased",
            "upcoming": "Upcoming",
        }
        status_val = status_map.get(status_raw, status_raw)

        return ProviderAnimeDetails(
            provider="kitsu",
            provider_id=item_id,
            title=display_title,
            canonical_title=canonical_title,
            english_title=en_title,
            romaji_title=en_jp_title,
            japanese_title=ja_jp_title,
            all_titles=all_titles,
            poster_url=safe_poster_url,
            total_episodes=total_episodes,
            status=status_val,
            media_type=attrs.get("showType"),  # TV, movie, OVA, etc.
            genres=[],
            year=year,
            start_date=start_date,
            end_date=attrs.get("endDate"),
            synopsis=attrs.get("synopsis"),
            source_url=f"https://kitsu.app/anime/{item_id}",
            raw_payload=raw_data,
        )

    def retrieve_available_artwork(self, details: ProviderAnimeDetails) -> Optional[str]:
        return details.poster_url

    def retrieve_episode_information(self, details: ProviderAnimeDetails) -> Optional[int]:
        return details.total_episodes
