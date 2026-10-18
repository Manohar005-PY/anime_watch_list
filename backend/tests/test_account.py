import pytest
from app.core.config import settings


def test_update_preferences(client, user_a):
    headers = user_a["headers"]
    
    update_res = client.patch("/api/v1/account/preferences", json={
        "display_mode": "list",
        "reduce_motion": True,
        "theme": "charcoal"
    }, headers=headers)
    assert update_res.status_code == 200
    prefs = update_res.json()["preferences"]
    assert prefs["display_mode"] == "list"
    assert prefs["reduce_motion"] is True
    assert prefs["theme"] == "charcoal"


def test_delete_account_cascades(client, user_a):
    headers = user_a["headers"]
    
    # Add an anime for user_a
    add_res = client.post("/api/v1/anime", json={
        "title": "Serial Experiments Lain",
        "status": "COMPLETED"
    }, headers=headers)
    anime_id = add_res.json()["id"]

    # Delete user_a account
    del_res = client.delete("/api/v1/account", headers=headers)
    assert del_res.status_code == 200
    assert "deleted" in del_res.json()["message"]

    # Session is now invalid
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 401

    # Login fails
    login_res = client.post("/api/v1/auth/login", json={
        "email": user_a["email"],
        "password": user_a["password"]
    })
    assert login_res.status_code == 401
