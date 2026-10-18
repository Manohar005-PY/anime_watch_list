import pytest
from app.services.metadata.mock import MockMetadataProvider
from app.services.metadata.factory import reset_metadata_provider_for_testing
from app.schemas.anime import validate_safe_poster_url
from app.core.config import settings


@pytest.fixture(autouse=True)
def setup_mock_provider():
    provider = MockMetadataProvider()
    reset_metadata_provider_for_testing(provider)
    yield
    reset_metadata_provider_for_testing(None)


def test_single_anime_refresh_updates_total_episodes(client, user_a):
    headers = user_a["headers"]

    # Create anime entry with missing provider ID and outdated total episodes
    res = client.post("/api/v1/anime", json={
        "title": "Cowboy Bebop",
        "status": "WATCHING",
        "watched_episodes": 12,
        "total_episodes": 15,
    }, headers=headers)
    assert res.status_code == 201
    anime = res.json()

    # Trigger single refresh
    refresh_res = client.post(f"/api/v1/anime/{anime['id']}/refresh", headers=headers)
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert data["status"] == "UPDATED"
    assert data["updated_total_episodes"] == 26
    assert data["provider_media_id"] == "1"

    # Verify anime in library has updated episode count and poster
    fetch_res = client.get(f"/api/v1/anime/{anime['id']}", headers=headers)
    assert fetch_res.status_code == 200
    updated = fetch_res.json()
    assert updated["total_episodes"] == 26
    assert updated["poster_url"] is not None
    assert updated["watched_episodes"] == 12  # Watched episodes preserved!


def test_non_destructive_conflict_preserves_user_progress(client, user_a):
    headers = user_a["headers"]

    # User watched 30 episodes of a show that provider says is 26 episodes
    res = client.post("/api/v1/anime", json={
        "title": "Cowboy Bebop",
        "status": "COMPLETED",
        "watched_episodes": 30,
        "total_episodes": 30,
    }, headers=headers)
    assert res.status_code == 201
    anime = res.json()

    # Refresh
    refresh_res = client.post(f"/api/v1/anime/{anime['id']}/refresh", headers=headers)
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert data["status"] == "CONFLICT"

    # Verify user watched episodes was NOT reduced
    fetch_res = client.get(f"/api/v1/anime/{anime['id']}", headers=headers)
    assert fetch_res.status_code == 200
    entry = fetch_res.json()
    assert entry["watched_episodes"] == 30
    assert entry["metadata_sync_status"] == "CONFLICT_EPISODES"


def test_batch_refresh_scheduler_token_security(client, user_a):
    # Missing token -> 401
    res_no_token = client.post("/api/v1/metadata/refresh/batch")
    assert res_no_token.status_code == 401

    # Invalid token -> 401
    res_bad_token = client.post(
        "/api/v1/metadata/refresh/batch",
        headers={"X-Scheduler-Token": "invalid-token-123"}
    )
    assert res_bad_token.status_code == 401

    # Valid token -> 200
    token = settings.SCHEDULER_SECRET_TOKEN
    res_valid = client.post(
        "/api/v1/metadata/refresh/batch?limit=10",
        headers={"X-Scheduler-Token": token}
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert "processed_count" in data
    assert "updated_count" in data


def test_poster_url_ssrf_rejections():
    # Valid https
    assert validate_safe_poster_url("https://media.kitsu.app/anime/poster.jpg") == "https://media.kitsu.app/anime/poster.jpg"

    # Insecure http
    with pytest.raises(ValueError, match="https"):
        validate_safe_poster_url("http://media.kitsu.app/anime/poster.jpg")

    # Cloud metadata endpoint
    with pytest.raises(ValueError):
        validate_safe_poster_url("https://169.254.169.254/latest/meta-data")

    # Localhost
    with pytest.raises(ValueError):
        validate_safe_poster_url("https://localhost:8000/image.png")

    with pytest.raises(ValueError):
        validate_safe_poster_url("https://127.0.0.1:8000/image.png")
