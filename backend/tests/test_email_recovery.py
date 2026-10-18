import pytest
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


def test_password_reset_token_never_leaked_in_production(client):
    # Set ENVIRONMENT to production
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"

    email = "asuka@nerv.de"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})

    try:
        res = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert res.status_code == 200
        data = res.json()
        assert data["message"] == "If an account exists with that email, password reset instructions have been sent."
        # In production, detail MUST be None - never exposing the reset token!
        assert data.get("detail") is None
    finally:
        settings.ENVIRONMENT = orig_env
