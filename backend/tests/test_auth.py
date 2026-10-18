import pytest
from app.core.config import settings


def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "test_pilot@kage.internal",
        "password": "StrongPassword123!",
        "display_name": "Shinji"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test_pilot@kage.internal"
    assert data["display_name"] == "Shinji"
    assert "password_hash" not in data


def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@kage.internal",
        "password": "StrongPassword123!",
        "display_name": "Asuka"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration should conflict (409)
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_login_success_sets_secure_cookie(client):
    email = "pilot_rei@kage.internal"
    password = "ReiPassword999!"
    client.post("/api/v1/auth/register", json={"email": email, "password": password})

    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    assert settings.SESSION_COOKIE_NAME in res.cookies
    token = res.cookies[settings.SESSION_COOKIE_NAME]
    assert len(token) > 20

    # Verify session against /me
    me_res = client.get("/api/v1/auth/me", cookies={settings.SESSION_COOKIE_NAME: token})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email


def test_login_invalid_password(client):
    email = "misato@kage.internal"
    password = "CorrectPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": password})

    res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_logout_clears_session(client):
    email = "gendo@kage.internal"
    password = "DarkSecretPassword1!"
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200

    csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME, "")
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"X-CSRF-Token": csrf_token} if csrf_token else {}
    )
    assert logout_res.status_code == 200

    # Now /me with the old token should be 401 Unauthorized
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 401


def test_csrf_double_submit_protection(client):
    """Verify that state-changing requests with session cookie but missing CSRF header fail with 403."""
    email = "csrf_victim@kage.internal"
    password = "SecretPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": password})

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME)
    assert csrf_token is not None

    # Mutating request with valid session cookie and valid CSRF cookie, but MISSING X-CSRF-Token header
    tampered_res = client.post("/api/v1/auth/logout")
    assert tampered_res.status_code == 403
    assert "CSRF validation failed" in tampered_res.json()["detail"]


def test_password_reset_flow(client):
    email = "reset_user@kage.internal"
    old_pwd = "OldPassword123!"
    new_pwd = "BrandNewPassword456!"
    client.post("/api/v1/auth/register", json={"email": email, "password": old_pwd})

    # Request reset
    req_res = client.post("/api/v1/auth/password-reset/request", json={"email": email})
    assert req_res.status_code == 200
    detail = req_res.json().get("detail", "")
    assert "Dev reset token: " in detail
    token = detail.replace("Dev reset token: ", "").strip()

    # Confirm reset with token
    confirm_res = client.post("/api/v1/auth/password-reset/confirm", json={
        "token": token,
        "new_password": new_pwd
    })
    assert confirm_res.status_code == 200

    # Old password fails
    fail_res = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    assert fail_res.status_code == 401

    # New password succeeds
    ok_res = client.post("/api/v1/auth/login", json={"email": email, "password": new_pwd})
    assert ok_res.status_code == 200
