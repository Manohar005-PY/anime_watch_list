import pytest
from app.core.config import settings


def test_create_and_get_anime(client, user_a):
    headers = user_a["headers"]
    
    payload = {
        "title": "Cowboy Bebop",
        "alternate_title": "カウボーイビバップ",
        "poster_url": "https://example.com/bebop.jpg",
        "status": "WATCHING",
        "total_episodes": 26,
        "watched_episodes": 5,
        "rating": 10,
        "notes": "Classic jazz space opera",
        "is_favorite": True,
        "genres": ["Sci-Fi", "Action"]
    }
    create_res = client.post("/api/v1/anime", json=payload, headers=headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["title"] == "Cowboy Bebop"
    assert created_data["watched_episodes"] == 5
    assert created_data["is_favorite"] is True
    assert created_data["user_id"] == user_a["user_id"]
    anime_id = created_data["id"]

    # Retrieve
    get_res = client.get(f"/api/v1/anime/{anime_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == anime_id


def test_watched_episodes_exceeding_total_fails(client, user_a):
    headers = user_a["headers"]
    
    payload = {
        "title": "Trigun Stampede",
        "status": "WATCHING",
        "total_episodes": 12,
        "watched_episodes": 15  # Invalid: 15 > 12
    }
    res = client.post("/api/v1/anime", json=payload, headers=headers)
    assert res.status_code in (400, 422)


def test_duplicate_title_for_same_user_fails(client, user_a):
    headers = user_a["headers"]
    
    payload = {
        "title": "Samurai Champloo",
        "status": "PLANNED"
    }
    res1 = client.post("/api/v1/anime", json=payload, headers=headers)
    assert res1.status_code == 201

    # Exact same normalized title should conflict
    res2 = client.post("/api/v1/anime", json={
        "title": "samurai   champloo!!",  # Normalizes to 'samurai champloo'
        "status": "COMPLETED"
    }, headers=headers)
    assert res2.status_code == 409
    assert "already exists in your library" in res2.json()["detail"]


def test_progress_update_auto_completes(client, user_a):
    headers = user_a["headers"]
    
    create_res = client.post("/api/v1/anime", json={
        "title": "FLCL",
        "status": "WATCHING",
        "total_episodes": 6,
        "watched_episodes": 1
    }, headers=headers)
    anime_id = create_res.json()["id"]

    # Update progress to 6 (all watched)
    patch_res = client.patch(f"/api/v1/anime/{anime_id}/progress", json={
        "watched_episodes": 6
    }, headers=headers)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["watched_episodes"] == 6
    assert updated["status"] == "COMPLETED"
    assert updated["completed_at"] is not None


def test_toggle_favorite(client, user_a):
    headers = user_a["headers"]
    
    create_res = client.post("/api/v1/anime", json={
        "title": "Neon Genesis Evangelion",
        "is_favorite": False
    }, headers=headers)
    anime_id = create_res.json()["id"]

    # Toggle to true
    res1 = client.post(f"/api/v1/anime/{anime_id}/toggle-favorite", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["is_favorite"] is True

    # Toggle back to false
    res2 = client.post(f"/api/v1/anime/{anime_id}/toggle-favorite", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["is_favorite"] is False


def test_filtering_and_sorting(client, user_a):
    headers = user_a["headers"]
    
    client.post("/api/v1/anime", json={
        "title": "Ghost in the Shell: SAC",
        "status": "COMPLETED",
        "rating": 9,
        "genres": ["Cyberpunk", "Action"]
    }, headers=headers)
    client.post("/api/v1/anime", json={
        "title": "Mushishi",
        "status": "WATCHING",
        "rating": 10,
        "genres": ["Supernatural", "Slice of Life"]
    }, headers=headers)

    # Filter by status COMPLETED
    res_status = client.get("/api/v1/anime?status=COMPLETED", headers=headers)
    assert res_status.status_code == 200
    items = res_status.json()["items"]
    assert all(item["status"] == "COMPLETED" for item in items)

    # Search query
    res_search = client.get("/api/v1/anime?q=mushishi", headers=headers)
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) == 1
    assert res_search.json()["items"][0]["title"] == "Mushishi"
