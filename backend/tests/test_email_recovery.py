import pytest
from unittest.mock import patch
from app.services.email_service import EmailService
from app.core.config import settings


def test_email_masking_for_logs():
    assert EmailService.mask_email("shinji.ikari@nerv.jp") == "s***@nerv.jp"
    assert EmailService.mask_email("a@b.com") == "a***@b.com"
    assert EmailService.mask_email("invalid-email") == "***"


def test_crlf_header_injection_sanitization():
    dirty_email = "victim@example.com\r\nBcc: hacker@evil.com\r\n"
    clean = EmailService.sanitize_header(dirty_email)
    assert "\r" not in clean
    assert "\n" not in clean
    assert clean == "victim@example.comBcc: hacker@evil.com"


def test_password_reset_email_dispatch_mock():
    # Configure mock provider
    orig_provider = settings.EMAIL_PROVIDER
    settings.EMAIL_PROVIDER = "mock"
    EmailService.sent_emails.clear()

    try:
        success = EmailService.send_password_reset_email(
            to_email="rei.ayanami@nerv.jp",
            token="expiring-single-use-uuid-token",
            display_name="Rei Ayanami"
        )
        assert success is True
        assert len(EmailService.sent_emails) == 1
        sent = EmailService.sent_emails[0]
        assert sent["to"] == "rei.ayanami@nerv.jp"
        assert "expiring-single-use-uuid-token" in sent["url"]
        assert "/reset-password?token=" in sent["url"]
    finally:
        settings.EMAIL_PROVIDER = orig_provider
        EmailService.sent_emails.clear()


def test_production_fails_safely_when_email_missing(client):
    """In production, missing SMTP configuration MUST fail safely with 503, never fall back to console."""
    orig_env = settings.ENVIRONMENT
    orig_host = settings.SMTP_HOST
    orig_prov = settings.EMAIL_PROVIDER
    settings.ENVIRONMENT = "production"
    settings.EMAIL_PROVIDER = "smtp"
    settings.SMTP_HOST = None  # Missing SMTP config

    email = "misconfigured@kage.internal"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})

    try:
        res = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert res.status_code == 503
        assert "Email delivery service is currently unavailable" in res.json()["detail"]
    finally:
        settings.ENVIRONMENT = orig_env
        settings.SMTP_HOST = orig_host
        settings.EMAIL_PROVIDER = orig_prov


def test_password_reset_token_never_leaked_in_production(client):
    """Verify that even when email delivery succeeds in production, tokens are never exposed in API responses."""
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"

    email = "asuka@nerv.de"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})

    # Mock EmailService to simulate successful real SMTP dispatch
    with patch.object(EmailService, "send_password_reset_email", return_value=True):
        try:
            res = client.post("/api/v1/auth/password-reset/request", json={"email": email})
            assert res.status_code == 200
            data = res.json()
            assert data["message"] == "If an account exists with that email, password reset instructions have been sent."
            # In production, detail MUST be None - never exposing the reset token!
            assert data.get("detail") is None
        finally:
            settings.ENVIRONMENT = orig_env


def test_password_reset_single_use_and_session_revocation(client):
    """Verify single-use token consumption and active session revocation upon password reset."""
    email = "revocation_user@kage.internal"
    old_pwd = "OldPassword123!"
    new_pwd = "NewSecurePassword456!"

    client.post("/api/v1/auth/register", json={"email": email, "password": old_pwd})

    # User logs in and establishes active session
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    session_token = login_res.cookies[settings.SESSION_COOKIE_NAME]

    # Verify session is valid
    me_res = client.get("/api/v1/auth/me", cookies={settings.SESSION_COOKIE_NAME: session_token})
    assert me_res.status_code == 200

    # Request password reset
    csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME, "")
    req_res = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": email},
        headers={"X-CSRF-Token": csrf_token} if csrf_token else {}
    )
    assert req_res.status_code == 200
    token = req_res.json()["detail"].replace("Dev reset token: ", "").strip()

    # Confirm password reset with single-use token
    confirm_res = client.post("/api/v1/auth/password-reset/confirm", json={
        "token": token,
        "new_password": new_pwd
    }, headers={"X-CSRF-Token": csrf_token} if csrf_token else {})
    assert confirm_res.status_code == 200

    # 1. Attempting to REUSE the single-use token MUST fail with 400 Bad Request
    reuse_res = client.post("/api/v1/auth/password-reset/confirm", json={
        "token": token,
        "new_password": "AnotherPassword789!"
    }, headers={"X-CSRF-Token": csrf_token} if csrf_token else {})
    assert reuse_res.status_code == 400
    assert "Invalid or expired password reset token" in reuse_res.json()["detail"]

    # 2. Existing active session MUST be revoked
    stale_me_res = client.get("/api/v1/auth/me", cookies={settings.SESSION_COOKIE_NAME: session_token})
    assert stale_me_res.status_code == 401

    # 3. Old password fails, new password succeeds (clear cookies to simulate fresh unauthenticated login)
    client.cookies.clear()
    fail_res = client.post("/api/v1/auth/login", json={"email": email, "password": old_pwd})
    assert fail_res.status_code == 401

    ok_res = client.post("/api/v1/auth/login", json={"email": email, "password": new_pwd})
    assert ok_res.status_code == 200


def test_smtp_delivery_success_mocked_smtplib():
    """Verify that SMTP provider correctly invokes starttls, auth, and sendmail."""
    orig_prov = settings.EMAIL_PROVIDER
    orig_host = settings.SMTP_HOST
    orig_user = settings.SMTP_USER
    orig_pass = settings.SMTP_PASSWORD

    settings.EMAIL_PROVIDER = "smtp"
    settings.SMTP_HOST = "smtp.sendgrid.net"
    settings.SMTP_PORT = 587
    settings.SMTP_USER = "apikey"
    settings.SMTP_PASSWORD = "SG.mocked_key_for_testing"

    with patch("smtplib.SMTP") as mock_smtp_cls:
        mock_server = mock_smtp_cls.return_value
        try:
            success = EmailService.send_password_reset_email(
                to_email="motoko.kusanagi@section9.gov",
                token="test-secret-token-12345",
                display_name="Major Motoko"
            )
            assert success is True
            mock_smtp_cls.assert_called_once_with("smtp.sendgrid.net", 587, timeout=15)
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once_with("apikey", "SG.mocked_key_for_testing")
            mock_server.sendmail.assert_called_once()
            mock_server.quit.assert_called_once()
        finally:
            settings.EMAIL_PROVIDER = orig_prov
            settings.SMTP_HOST = orig_host
            settings.SMTP_USER = orig_user
            settings.SMTP_PASSWORD = orig_pass


def test_smtp_socket_failure_returns_false_safely():
    """Verify that network or socket errors during SMTP dispatch fail safely without crashing."""
    import smtplib
    orig_prov = settings.EMAIL_PROVIDER
    orig_host = settings.SMTP_HOST

    settings.EMAIL_PROVIDER = "smtp"
    settings.SMTP_HOST = "smtp.sendgrid.net"

    with patch("smtplib.SMTP", side_effect=smtplib.SMTPConnectError(421, "Connection refused")):
        try:
            success = EmailService.send_password_reset_email(
                to_email="batou@section9.gov",
                token="test-secret-token-67890"
            )
            assert success is False
        finally:
            settings.EMAIL_PROVIDER = orig_prov
            settings.SMTP_HOST = orig_host


def test_password_reset_nonexistent_email_prevents_user_enumeration(client):
    """Verify that requesting reset for unknown email returns 200 without sending email or leaking user existence."""
    with patch.object(EmailService, "send_password_reset_email") as mock_send:
        res = client.post("/api/v1/auth/password-reset/request", json={
            "email": "definitely_does_not_exist@kage.internal"
        })
        assert res.status_code == 200
        assert res.json()["message"] == "If an account exists with that email, password reset instructions have been sent."
        # No email should be sent for nonexistent accounts
        mock_send.assert_not_called()

