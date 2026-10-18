import re
from typing import Optional, List, Dict
from app.services.metadata.base import (
    BaseMetadataProvider,
    ProviderAnimeCandidate,
    ProviderAnimeDetails,
)


class MockMetadataProvider(BaseMetadataProvider):
    """Deterministic, offline mock provider for automated unit tests and edge case simulation."""

    name: str = "mock"

    def __init__(self):
        self.database: Dict[str, dict] = {
            "1": {
                "id": "1",
                "title": "Cowboy Bebop",
                "canonical_title": "Cowboy Bebop",
                "english_title": "Cowboy Bebop",
                "romaji_title": "Cowboy Bebop",
                "japanese_title": "カウボーイビバップ",
                "all_titles": ["Cowboy Bebop", "カウボーイビバップ"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/1/large.jpg",
                "total_episodes": 26,
                "status": "Completed",
                "media_type": "TV",
                "year": 1998,
            },
            "30": {
                "id": "30",
                "title": "Neon Genesis Evangelion",
                "canonical_title": "Shin Seiki Evangelion",
                "english_title": "Neon Genesis Evangelion",
                "romaji_title": "Shin Seiki Evangelion",
                "japanese_title": "新世紀エヴァンゲリオン",
                "all_titles": ["Neon Genesis Evangelion", "Shin Seiki Evangelion", "新世紀エヴァンゲリオン"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/30/large.jpg",
                "total_episodes": 26,
                "status": "Completed",
                "media_type": "TV",
                "year": 1995,
            },
            "1555": {
                "id": "1555",
                "title": "Naruto: Shippuuden",
                "canonical_title": "Naruto: Shippuuden",
                "english_title": "Naruto: Shippuden",
                "romaji_title": "Naruto: Shippuuden",
                "japanese_title": "ナルト 疾風伝",
                "all_titles": ["Naruto: Shippuuden", "Naruto: Shippuden", "Naruto Shippuden", "ナルト 疾風伝"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/1555/large.jpg",
                "total_episodes": 500,
                "status": "Completed",
                "media_type": "TV",
                "year": 2007,
            },
            "11": {
                "id": "11",
                "title": "Naruto",
                "canonical_title": "Naruto",
                "english_title": "Naruto",
                "romaji_title": "Naruto",
                "japanese_title": "ナルト",
                "all_titles": ["Naruto", "ナルト"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/11/large.jpg",
                "total_episodes": 220,
                "status": "Completed",
                "media_type": "TV",
                "year": 2002,
            },
            "3936": {
                "id": "3936",
                "title": "Fullmetal Alchemist: Brotherhood",
                "canonical_title": "Hagane no Renkinjutsushi: Fullmetal Alchemist",
                "english_title": "Fullmetal Alchemist: Brotherhood",
                "romaji_title": "Hagane no Renkinjutsushi",
                "japanese_title": "鋼の錬金術師",
                "all_titles": [
                    "Fullmetal Alchemist: Brotherhood",
                    "Hagane no Renkinjutsushi: Fullmetal Alchemist",
                    "Hagane no Renkinjutsushi",
                    "鋼の錬金術師",
                ],
                "poster_url": "https://media.kitsu.app/anime/poster_images/3936/large.jpg",
                "total_episodes": 64,
                "status": "Completed",
                "media_type": "TV",
                "year": 2009,
            },
            "7442": {
                "id": "7442",
                "title": "Attack on Titan",
                "canonical_title": "Shingeki no Kyojin",
                "english_title": "Attack on Titan",
                "romaji_title": "Shingeki no Kyojin",
                "japanese_title": "進撃の巨人",
                "all_titles": ["Attack on Titan", "Shingeki no Kyojin", "Attack on Titan Season 1"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/7442/large.jpg",
                "total_episodes": 25,
                "status": "Completed",
                "media_type": "TV",
                "year": 2013,
            },
            "8671": {
                "id": "8671",
                "title": "Attack on Titan Season 2",
                "canonical_title": "Shingeki no Kyojin Season 2",
                "english_title": "Attack on Titan Season 2",
                "romaji_title": "Shingeki no Kyojin Season 2",
                "japanese_title": "進撃の巨人 Season 2",
                "all_titles": ["Attack on Titan Season 2", "Shingeki no Kyojin Season 2", "Attack on Titan 2"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/8671/large.jpg",
                "total_episodes": 12,
                "status": "Completed",
                "media_type": "TV",
                "year": 2017,
            },
            "12": {
                "id": "12",
                "title": "One Piece",
                "canonical_title": "One Piece",
                "english_title": "One Piece",
                "romaji_title": "One Piece",
                "japanese_title": "ワンピース",
                "all_titles": ["One Piece", "ワンピース"],
                "poster_url": "https://media.kitsu.app/anime/poster_images/12/large.jpg",
                "total_episodes": None,  # Ongoing series has null episode count
                "status": "Airing",
                "media_type": "TV",
                "year": 1999,
            },
            "9999": {
                "id": "9999",
                "title": "Serial Experiments Lain (No Poster)",
                "canonical_title": "Serial Experiments Lain",
                "english_title": "Serial Experiments Lain",
                "all_titles": ["Serial Experiments Lain (No Poster)"],
                "poster_url": None,  # Test null poster artwork
                "total_episodes": 13,
                "status": "Completed",
                "media_type": "TV",
                "year": 1998,
            },
        }

    async def search_anime(self, query: str, limit: int = 5) -> List[ProviderAnimeCandidate]:
        if not query or not query.strip():
            return []

        q_clean = query.strip().lower()
        candidates = []

        for item in self.database.values():
            # Check if any title matches
            matched = False
            for t in item["all_titles"]:
                if q_clean in t.lower() or t.lower() in q_clean:
                    matched = True
                    break
            
            if matched:
                candidates.append(
                    ProviderAnimeCandidate(
                        provider="mock",
                        provider_id=item["id"],
                        title=item["title"],
                        canonical_title=item["canonical_title"],
                        english_title=item.get("english_title"),
                        romaji_title=item.get("romaji_title"),
                        japanese_title=item.get("japanese_title"),
                        all_titles=item["all_titles"],
                        poster_url=item["poster_url"],
                        total_episodes=item["total_episodes"],
                        status=item.get("status"),
                        media_type=item.get("media_type"),
                        genres=[],
                        year=item.get("year"),
                        source_url=f"https://mock.kage.app/anime/{item['id']}",
                    )
                )

        return candidates[:limit]

    async def get_anime_by_provider_id(self, provider_id: str) -> Optional[ProviderAnimeDetails]:
        item = self.database.get(provider_id)
        if not item:
            return None
        return self.normalize_metadata(item)

    def normalize_metadata(self, raw_data: dict) -> ProviderAnimeDetails:
        return ProviderAnimeDetails(
            provider="mock",
            provider_id=raw_data["id"],
            title=raw_data["title"],
            canonical_title=raw_data["canonical_title"],
            english_title=raw_data.get("english_title"),
            romaji_title=raw_data.get("romaji_title"),
            japanese_title=raw_data.get("japanese_title"),
            all_titles=raw_data.get("all_titles", []),
            poster_url=raw_data.get("poster_url"),
            total_episodes=raw_data.get("total_episodes"),
            status=raw_data.get("status"),
            media_type=raw_data.get("media_type"),
            genres=[],
            year=raw_data.get("year"),
            source_url=f"https://mock.kage.app/anime/{raw_data['id']}",
            raw_payload=raw_data,
        )

    def retrieve_available_artwork(self, details: ProviderAnimeDetails) -> Optional[str]:
        return details.poster_url

    def retrieve_episode_information(self, details: ProviderAnimeDetails) -> Optional[int]:
        return details.total_episodes
