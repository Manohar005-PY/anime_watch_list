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
