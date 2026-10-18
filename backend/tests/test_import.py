import pytest
from app.services.import_service import (
    parse_raw_text,
    parse_raw_csv,
    ImportService,
)
from app.services.matching_engine import TitleMatchingEngine
from app.services.metadata.mock import MockMetadataProvider
from app.services.metadata.factory import reset_metadata_provider_for_testing
from app.schemas.anime import AnimeStatus


@pytest.fixture(autouse=True)
def setup_mock_provider():
    provider = MockMetadataProvider()
    reset_metadata_provider_for_testing(provider)
    yield
    reset_metadata_provider_for_testing(None)


def test_parse_raw_text_cleaning_and_deduplication():
    raw_input = """
    1. Cowboy Bebop
    - Neon Genesis Evangelion
    * Naruto
    • Fullmetal Alchemist: Brotherhood
    # This is a comment
    Cowboy Bebop
    "Attack on Titan"
    """
    rows = parse_raw_text(raw_input)
    titles = [r.raw_title for r in rows]
    assert "Cowboy Bebop" in titles
    assert "Neon Genesis Evangelion" in titles
    assert "Naruto" in titles
    assert "Fullmetal Alchemist: Brotherhood" in titles
    assert "Attack on Titan" in titles
    # Verify deduplication
    assert titles.count("Cowboy Bebop") == 1
    # Verify default status and episodes
    for r in rows:
        assert r.status == AnimeStatus.PLANNED
        assert r.watched_episodes == 0
        assert r.rating is None


def test_parse_raw_csv_with_headers():
    csv_data = """title,status,watched_episodes,total_episodes,rating,notes
Cowboy Bebop,Completed,26,26,10,Timeless jazz masterpiece
Naruto,watching,120,220,8,Chunin exams arc
Attack on Titan,plan to watch,0,,9,Heard great things
"""
    rows, errors = parse_raw_csv(csv_data)
    assert len(errors) == 0
    assert len(rows) == 3

    bebop = rows[0]
    assert bebop.raw_title == "Cowboy Bebop"
    assert bebop.status == AnimeStatus.COMPLETED
    assert bebop.watched_episodes == 26
    assert bebop.total_episodes == 26
    assert bebop.rating == 10
    assert bebop.notes == "Timeless jazz masterpiece"

    naruto = rows[1]
    assert naruto.raw_title == "Naruto"
    assert naruto.status == AnimeStatus.WATCHING
    assert naruto.watched_episodes == 120
    assert naruto.total_episodes == 220
    assert naruto.rating == 8

    aot = rows[2]
    assert aot.raw_title == "Attack on Titan"
    assert aot.status == AnimeStatus.PLANNED
    assert aot.watched_episodes == 0
    assert aot.total_episodes is None
    assert aot.rating == 9


def test_title_matching_engine_disambiguation():
    mock = MockMetadataProvider()
    candidates = [
        mock.database["7442"],  # Attack on Titan (S1)
        mock.database["8671"],  # Attack on Titan Season 2
    ]
    cand_objects = [
        mock.normalize_metadata(c) for c in candidates
    ]
    # Convert ProviderAnimeDetails to ProviderAnimeCandidate
    from app.services.metadata.base import ProviderAnimeCandidate
    cands = [
        ProviderAnimeCandidate(
            provider=c.provider,
            provider_id=c.provider_id,
            title=c.title,
            canonical_title=c.canonical_title,
            english_title=c.english_title,
            all_titles=c.all_titles,
            poster_url=c.poster_url,
            total_episodes=c.total_episodes,
        ) for c in cand_objects
    ]

    # Matching Season 1
    best_s1, status_s1, conf_s1, _ = TitleMatchingEngine.evaluate_candidates("Attack on Titan", cands)
    assert best_s1.provider_id == "7442"
    assert conf_s1 > 0.8

    # Matching Season 2
    best_s2, status_s2, conf_s2, _ = TitleMatchingEngine.evaluate_candidates("Attack on Titan Season 2", cands)
    assert best_s2.provider_id == "8671"
    assert conf_s2 > 0.8


def test_import_job_creation_and_discovery(client, user_a):
    headers = user_a["headers"]

    # Step 1: Parse input
    parse_res = client.post("/api/v1/import/parse", json={
        "text_content": "Cowboy Bebop\nNeon Genesis Evangelion\nUnknown Show 12345",
        "file_type": "text"
    }, headers=headers)
    assert parse_res.status_code == 200
    parse_data = parse_res.json()
    assert parse_data["total_rows"] == 3

    # Step 2: Create import job
    job_res = client.post("/api/v1/import/jobs", json={
        "source_type": "PASTE",
        "items": parse_data["preview_items"]
    }, headers=headers)
    assert job_res.status_code == 201
    job = job_res.json()
    job_id = job["id"]
    assert job["total_items"] == 3
    assert job["status"] == "REVIEW"

    # Verify discovery results
    items = job["items"]
    bebop_item = next(it for it in items if "Cowboy" in it["raw_title"])
    assert bebop_item["status"] == "MATCHED"
    assert bebop_item["provider_media_id"] == "1"
    assert bebop_item["total_episodes"] == 26
    assert bebop_item["poster_url"] is not None
    assert bebop_item["is_duplicate"] is False

    unknown_item = next(it for it in items if "Unknown Show" in it["raw_title"])
    assert unknown_item["status"] == "UNMATCHED"


def test_import_job_confirm_with_duplicate_resolutions(client, user_a):
    headers = user_a["headers"]

    # Pre-populate user's library with Naruto (watched: 10, total: 220)
    create_res = client.post("/api/v1/anime", json={
        "title": "Naruto",
        "status": "WATCHING",
        "watched_episodes": 10,
        "total_episodes": 220,
    }, headers=headers)
    assert create_res.status_code == 201
    naruto_entry = create_res.json()

    # Create import job containing Naruto and Cowboy Bebop
    job_res = client.post("/api/v1/import/jobs", json={
        "source_type": "PASTE",
        "items": [
            {
                "raw_title": "Naruto",
                "status": "WATCHING",
                "watched_episodes": 50,
                "rating": 9,
                "notes": "Merged note"
            },
            {
                "raw_title": "Cowboy Bebop",
                "status": "COMPLETED",
                "watched_episodes": 26,
            }
        ]
    }, headers=headers)
    assert job_res.status_code == 201
    job = job_res.json()
    job_id = job["id"]

    # Verify Naruto is detected as duplicate
    naruto_item = next(it for it in job["items"] if "Naruto" in it["raw_title"])
    assert naruto_item["is_duplicate"] is True
    assert naruto_item["existing_anime_id"] == naruto_entry["id"]

    bebop_item = next(it for it in job["items"] if "Cowboy" in it["raw_title"])
    assert bebop_item["is_duplicate"] is False

    # Confirm with duplicate resolution = "merge_progress"
    confirm_res = client.post(f"/api/v1/import/jobs/{job_id}/confirm", json={
        "actions": {
            naruto_item["id"]: "merge_progress"
        }
    }, headers=headers)
    assert confirm_res.status_code == 200
    confirmed_job = confirm_res.json()
    assert confirmed_job["status"] == "COMPLETED"
    assert confirmed_job["imported_items"] == 2

    # Check user's collection to verify Naruto progress was updated
    fetch_naruto = client.get(f"/api/v1/anime/{naruto_entry['id']}", headers=headers)
    assert fetch_naruto.status_code == 200
    updated_naruto = fetch_naruto.json()
    assert updated_naruto["watched_episodes"] == 50
    assert updated_naruto["rating"] == 9
    assert updated_naruto["notes"] == "Merged note"

    # Check that Cowboy Bebop was imported as a new entry
    list_res = client.get("/api/v1/anime?q=Bebop", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1


def test_import_job_idor_isolation(client, user_a, user_b):
    # User A creates an import job
    res = client.post("/api/v1/import/jobs", json={
        "source_type": "PASTE",
        "items": [{"raw_title": "Cowboy Bebop"}]
    }, headers=user_a["headers"])
    assert res.status_code == 201
    job_id = res.json()["id"]

    # User B attempts to access User A's job -> 404
    b_get = client.get(f"/api/v1/import/jobs/{job_id}", headers=user_b["headers"])
    assert b_get.status_code == 404

    # User B attempts to confirm User A's job -> 400 or 404
    b_confirm = client.post(f"/api/v1/import/jobs/{job_id}/confirm", json={"actions": {}}, headers=user_b["headers"])
    assert b_confirm.status_code in (400, 404)
