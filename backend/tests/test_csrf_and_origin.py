import pytest
import hmac
import hashlib
from app.core.config import settings
from app.core.security import generate_csrf_token, verify_csrf_token, validate_request_origin


def test_csrf_token_cryptographic_verification():
    # Valid anonymous token
    anon_token = generate_csrf_token()
    assert verify_csrf_token(anon_token) is True

    # Tampered token (invalid signature)
    parts = anon_token.split(".")
    tampered_sig = parts[0] + "." + parts[1] + ".0000000000000000000000000000000000000000000000000000000000000000"
    assert verify_csrf_token(tampered_sig) is False

    # Malformed token formats
    assert verify_csrf_token("invalid-format") is False
    assert verify_csrf_token("") is False
    assert verify_csrf_token("a.b") is False
    assert verify_csrf_token("a.b.c.d") is False


def test_csrf_token_session_binding():
    session_a = "session_token_spiegel_12345"
    session_b = "session_token_faye_67890"

    # Token bound to Session A
    token_a = generate_csrf_token(session_token=session_a)
    assert verify_csrf_token(token_a, session_token=session_a) is True

    # Attempting to use Token A with Session B must fail
    assert verify_csrf_token(token_a, session_token=session_b) is False

    # Attempting to use an anonymous token with an authenticated session must fail
    anon_token = generate_csrf_token()
    assert verify_csrf_token(anon_token, session_token=session_a) is False


def test_origin_validation_exact_matching():
    allowed = ["https://kage.app", "https://staging.kage.app"]

    # Exact valid matches
    valid, _ = validate_request_origin("https://kage.app", None, allowed)
    assert valid is True

    valid, _ = validate_request_origin("https://staging.kage.app", None, allowed)
    assert valid is True

    # Subdomain spoofing attempts
    valid, reason = validate_request_origin("https://kage.app.attacker.com", None, allowed)
    assert valid is False
    assert "Untrusted origin" in reason

    # Sibling spoofing attempts
    valid, reason = validate_request_origin("https://attacker-kage.app", None, allowed)
    assert valid is False
    assert "Untrusted origin" in reason

    # Path / query spoofing attempts
    valid, reason = validate_request_origin("https://attacker.com?kage.app", None, allowed)
    assert valid is False
    assert "Untrusted origin" in reason

    # Hostile or opaque null origin
    valid, reason = validate_request_origin("null", None, allowed)
    assert valid is False
    assert "null" in reason.lower()

    # Missing origin & referer
    valid, reason = validate_request_origin(None, None, allowed)
    assert valid is False
    assert "Missing Origin" in reason


def test_origin_validation_rejects_insecure_http_in_production():
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    allowed = ["https://kage.app"]

    try:
        valid, reason = validate_request_origin("http://kage.app", None, allowed)
        assert valid is False
        assert "Insecure scheme 'http'" in reason
    finally:
        settings.ENVIRONMENT = orig_env


def test_end_to_end_csrf_rejection_on_stolen_session(client, user_a, user_b):
    """Verify that an attacker on a sibling domain injecting an arbitrary cookie is blocked."""
    # User A is logged in with valid session
    email = "test_bound@kage.internal"
    pwd = "ValidPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200

    # Attacker crafts an arbitrary CSRF token (simulating sibling subdomain injection)
    foreign_csrf = "fakebinding.fakenonce.fakesig"
    client.cookies.set(settings.CSRF_COOKIE_NAME, foreign_csrf)

    # Attempt mutation passing attacker's token in both cookie and header
    res = client.post(
        "/api/v1/auth/logout",
        headers={"X-CSRF-Token": foreign_csrf}
    )
    # Must fail with 403 Forbidden because signature and session-binding are invalid!
    assert res.status_code == 403
    assert "CSRF validation failed" in res.json()["detail"]


def test_csrf_bootstrap_endpoint_unauthenticated(client):
    """Verify that unauthenticated clients can bootstrap an anonymous CSRF token."""
    res = client.get("/api/v1/auth/csrf-token")
    assert res.status_code == 200
    data = res.json()
    assert "csrf_token" in data
    token = data["csrf_token"]
    assert verify_csrf_token(token) is True
    # Cookie must also be set
    assert settings.CSRF_COOKIE_NAME in res.cookies


def test_csrf_bootstrap_endpoint_authenticated(client):
    """Verify that authenticated clients receive a session-bound CSRF token on bootstrap."""
    email = "bootstrap_user@kage.internal"
    pwd = "ValidPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    session_token = login_res.cookies.get(settings.SESSION_COOKIE_NAME)
    assert session_token is not None

    res = client.get("/api/v1/auth/csrf-token")
    assert res.status_code == 200
    token = res.json()["csrf_token"]
    # Must verify against the active session token
    assert verify_csrf_token(token, session_token=session_token) is True


def test_login_returns_session_bound_csrf_token(client):
    """Verify that login response includes csrf_token in the JSON body."""
    email = "login_csrf@kage.internal"
    pwd = "ValidPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    data = login_res.json()
    assert "csrf_token" in data
    assert data["csrf_token"] is not None
    session_token = login_res.cookies.get(settings.SESSION_COOKIE_NAME)
    assert verify_csrf_token(data["csrf_token"], session_token=session_token) is True


def test_valid_browser_session_performs_legitimate_mutations(client):
    """Verify that valid browser session with matching CSRF header can perform mutations."""
    email = "mutation_test@kage.internal"
    pwd = "ValidPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    csrf_token = login_res.json()["csrf_token"]

    # 1. Create anime with CSRF header
    create_res = client.post(
        "/api/v1/anime",
        json={"title": "Trigun Stampede", "status": "WATCHING", "total_episodes": 12},
        headers={"X-CSRF-Token": csrf_token}
    )
    assert create_res.status_code == 201
    anime_id = create_res.json()["id"]

    # 2. Update progress
    progress_res = client.patch(
        f"/api/v1/anime/{anime_id}/progress",
        json={"watched_episodes": 6},
        headers={"X-CSRF-Token": csrf_token}
    )
    assert progress_res.status_code == 200
    assert progress_res.json()["watched_episodes"] == 6

    # 3. Missing CSRF header on mutation must fail with 403
    fail_res = client.patch(
        f"/api/v1/anime/{anime_id}/progress",
        json={"watched_episodes": 7}
    )
    assert fail_res.status_code == 403


def test_hostile_origin_rejected_on_mutation(client):
    """Verify that state-changing requests from untrusted origins are blocked with 403."""
    email = "hostile_origin@kage.internal"
    pwd = "ValidPassword123!"
    client.post("/api/v1/auth/register", json={"email": email, "password": pwd})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    csrf_token = login_res.json()["csrf_token"]

    # Request from hostile origin
    res = client.post(
        "/api/v1/anime",
        json={"title": "Hellsing", "status": "PLANNED"},
        headers={
            "X-CSRF-Token": csrf_token,
            "Origin": "https://evil-phishing-site.com"
        }
    )
    assert res.status_code == 403
    assert "Cross-site request rejected" in res.json()["detail"]

