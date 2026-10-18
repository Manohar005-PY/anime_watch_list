import pytest
from app.core.config import settings


def test_horizontal_isolation_user_a_cannot_read_user_b_anime(client, user_a, user_b):
    # User B creates a private anime entry
    create_res = client.post("/api/v1/anime", json={
        "title": "User B Secret Show",
        "notes": "Highly confidential note",
        "status": "WATCHING"
    }, headers=user_b["headers"])
    assert create_res.status_code == 201
    anime_b_id = create_res.json()["id"]

    # User A tries to read User B's anime
    get_res = client.get(f"/api/v1/anime/{anime_b_id}", headers=user_a["headers"])
    
    # Must be 404 (not found in User A's collection)
    assert get_res.status_code == 404
    assert "Anime entry not found in your collection" in get_res.json()["detail"]


def test_horizontal_isolation_user_a_cannot_modify_user_b_anime(client, user_a, user_b):
    create_res = client.post("/api/v1/anime", json={
        "title": "Berserk 1997",
        "rating": 10,
        "status": "COMPLETED"
    }, headers=user_b["headers"])
    anime_b_id = create_res.json()["id"]

    # User A tries to alter rating and title of User B's entry
    put_res = client.put(f"/api/v1/anime/{anime_b_id}", json={
        "title": "Hacked Title",
        "rating": 1
    }, headers=user_a["headers"])
    assert put_res.status_code == 404

    # User A tries to update progress of User B's entry
    patch_res = client.patch(f"/api/v1/anime/{anime_b_id}/progress", json={
        "watched_episodes": 0
    }, headers=user_a["headers"])
    assert patch_res.status_code == 404

    # Verify User B's data remains untouched
    verify_res = client.get(f"/api/v1/anime/{anime_b_id}", headers=user_b["headers"])
    assert verify_res.status_code == 200
    assert verify_res.json()["title"] == "Berserk 1997"
    assert verify_res.json()["rating"] == 10


def test_horizontal_isolation_user_a_cannot_delete_user_b_anime(client, user_a, user_b):
    create_res = client.post("/api/v1/anime", json={
        "title": "Monster",
        "status": "WATCHING"
    }, headers=user_b["headers"])
    anime_b_id = create_res.json()["id"]

    # User A tries to delete it
    del_res = client.delete(f"/api/v1/anime/{anime_b_id}", headers=user_a["headers"])
    assert del_res.status_code == 404

    # Verify User B still owns it
    verify_res = client.get(f"/api/v1/anime/{anime_b_id}", headers=user_b["headers"])
    assert verify_res.status_code == 200
    assert verify_res.json()["title"] == "Monster"


def test_user_a_and_user_b_can_independently_track_same_anime(client, user_a, user_b):
    # Both users track "Death Note" independently
    res_a = client.post("/api/v1/anime", json={
        "title": "Death Note",
        "status": "COMPLETED",
        "rating": 9
    }, headers=user_a["headers"])
    assert res_a.status_code == 201

    res_b = client.post("/api/v1/anime", json={
        "title": "Death Note",
        "status": "WATCHING",
        "rating": 8
    }, headers=user_b["headers"])
    assert res_b.status_code == 201

    assert res_a.json()["id"] != res_b.json()["id"]
    assert res_a.json()["status"] == "COMPLETED"
    assert res_b.json()["status"] == "WATCHING"


def test_stats_and_export_do_not_leak_cross_user_data(client, user_a, user_b):
    # User B adds 2 entries
    client.post("/api/v1/anime", json={"title": "Steins;Gate", "status": "COMPLETED", "watched_episodes": 24}, headers=user_b["headers"])
    client.post("/api/v1/anime", json={"title": "Paranoia Agent", "status": "COMPLETED", "watched_episodes": 13}, headers=user_b["headers"])

    # User A has 0 entries so far in this test
    stats_a = client.get("/api/v1/stats", headers=user_a["headers"]).json()
    assert stats_a["total_titles"] == 0
    assert stats_a["total_episodes_watched"] == 0

    # User A exports data
    export_a = client.get("/api/v1/account/export", headers=user_a["headers"]).json()
    assert export_a["user_id"] == user_a["user_id"]
    assert export_a["total_entries"] == 0
    assert len(export_a["entries"]) == 0


def test_ssrf_prevention_on_poster_url(client, user_a):
    forbidden_urls = [
        "http://example.com/poster.jpg",          # Must use https
        "https://localhost:8080/secret.jpg",       # Localhost forbidden
        "https://127.0.0.1/admin.png",            # Loopback IP forbidden
        "https://169.254.169.254/latest/meta-data",# Cloud metadata forbidden
        "https://10.0.0.1/internal.jpg",          # RFC 1918 private IP forbidden
        "https://192.168.1.1/router.jpg",         # RFC 1918 private IP forbidden
        "https://metadata.google.internal/computeMetadata/v1/", # GCP metadata
    ]

    for bad_url in forbidden_urls:
        res = client.post("/api/v1/anime", json={
            "title": f"Anime Test {bad_url}",
            "poster_url": bad_url
        }, headers=user_a["headers"])
        assert res.status_code in (400, 422), f"Failed to block SSRF URL: {bad_url}"
