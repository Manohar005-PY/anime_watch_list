import pytest
from pydantic import ValidationError
from app.core.config import Settings


def test_production_rejects_default_secret_key():
    """Verify that Settings raises a validation error if default secret key is used in production."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="dev-secret-key-change-in-production-kage-super-secret-key-minimum-32-chars"
        )
    assert "Insecure or default SECRET_KEY" in str(exc_info.value)


def test_production_rejects_short_secret_key():
    """Verify that Settings rejects keys shorter than 64 hex characters in production."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"  # 32 chars
        )
    assert "must be at least 64 characters" in str(exc_info.value)


def test_production_accepts_strong_secret_key_and_forces_secure_cookie():
    """Verify that a 64-byte hex random key is accepted and session cookies are forced secure."""
    strong_key = "f" * 64
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=strong_key,
        SESSION_COOKIE_SECURE=False  # Should be automatically forced to True
    )
    assert s.SECRET_KEY == strong_key
    assert s.SESSION_COOKIE_SECURE is True
