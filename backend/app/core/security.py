from __future__ import annotations
import hashlib
import secrets
import time
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
import argon2
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# Argon2id hasher with RFC 9106 recommended parameters
hasher = argon2.PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    type=argon2.Type.ID
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        return hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def generate_session_token() -> str:
    """Generate cryptographically secure 256-bit URL-safe token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Compute SHA-256 hash of opaque token for safe DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class InMemoryRateLimiter:
    """Sliding-window rate limiter for sensitive endpoints (login, register)."""
    def __init__(self, max_requests: int = 5, window_seconds: int = 300):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> bool:
        from app.core.config import settings
        if settings.ENVIRONMENT == "test":
            return False
        now = time.time()
        window_start = now - self.window_seconds
        # Clean older entries
        self._requests[key] = [t for t in self._requests[key] if t > window_start]
        if len(self._requests[key]) >= self.max_requests:
            return True
        self._requests[key].append(now)
        return False

    def reset(self, key: str) -> None:
        if key in self._requests:
            del self._requests[key]


login_rate_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=300)
register_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=300)
reset_pwd_rate_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=300)


def generate_csrf_token(session_token: Optional[str] = None) -> str:
    """
    Generate an OWASP HMAC-SHA256 signed, session-bound CSRF token.
    If session_token is provided (authenticated user), the token is cryptographically
    bound to the user's specific session ID, preventing sibling-subdomain cookie injection attacks.
    Format: {session_binding_hash}.{nonce}.{signature}
    """
    import hmac
    from app.core.config import settings

    nonce = secrets.token_urlsafe(16)
    if session_token:
        # Cryptographic binding to this exact authenticated session
        binding = hashlib.sha256(session_token.encode("utf-8")).hexdigest()[:16]
    else:
        # Pre-auth / anonymous token with ephemeral entropy
        binding = "anon" + secrets.token_hex(6)

    # Compute HMAC signature using SECRET_KEY
    payload = f"{binding}:{nonce}"
    sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return f"{binding}.{nonce}.{sig}"


def verify_csrf_token(token: str, session_token: Optional[str] = None) -> bool:
    """
    Verify signature and session binding of a CSRF token.
    Returns True only if the HMAC signature is cryptographically valid AND
    if authenticated, the token is strictly bound to the current session.
    """
    import hmac
    from app.core.config import settings

    if not token or not isinstance(token, str):
        return False

    parts = token.split(".")
    if len(parts) != 3:
        return False

    binding, nonce, sig = parts
    payload = f"{binding}:{nonce}"
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(sig, expected_sig):
        return False

    # If session_token is provided, verify session binding
    if session_token:
        expected_binding = hashlib.sha256(session_token.encode("utf-8")).hexdigest()[:16]
        if not hmac.compare_digest(binding, expected_binding):
            return False

    return True


def validate_request_origin(origin_header: Optional[str], referer_header: Optional[str], allowed_origins: List[str]) -> Tuple[bool, str]:
    """
    Strictly validate Origin / Referer for state-changing HTTP requests.
    Guards against:
    - null Origin (sandboxed iframes, data URIs)
    - Hostile origins (e.g. evil-site.com)
    - Subdomain prefix/suffix spoofing (e.g. kage.app.attacker.com or attacker-kage.app)
    - Malformed or invalid URI schemes
    - Missing origins on browser requests
    """
    from urllib.parse import urlsplit
    from app.core.config import settings

    origin = origin_header

    # If Origin header is absent, inspect Referer
    if not origin and referer_header:
        try:
            parsed_ref = urlsplit(referer_header)
            if parsed_ref.scheme and parsed_ref.netloc:
                origin = f"{parsed_ref.scheme}://{parsed_ref.netloc}"
        except Exception:
            return False, "Malformed Referer header."

    if not origin:
        return False, "Missing Origin and Referer headers on state-changing request."

    origin_str = origin.strip().lower()
    if origin_str == "null":
        return False, "Hostile or opaque 'null' Origin rejected."

    try:
        parsed = urlsplit(origin)
    except Exception:
        return False, "Malformed Origin URL."

    if not parsed.scheme or not parsed.netloc:
        return False, "Malformed Origin: missing scheme or netloc."

    # In production, scheme MUST be https
    if settings.ENVIRONMENT == "production" and parsed.scheme != "https":
        return False, f"Insecure scheme '{parsed.scheme}' not permitted in production."

    normalized_origin = f"{parsed.scheme}://{parsed.netloc}"

    # In non-production, permit testserver, localhost, 127.0.0.1, and 0.0.0.0
    if settings.ENVIRONMENT != "production":
        if (
            parsed.netloc.startswith("localhost")
            or parsed.netloc.startswith("127.0.0.1")
            or parsed.netloc.startswith("0.0.0.0")
            or parsed.netloc == "testserver"
        ):
            return True, "Allowed dev/test origin."

    # Normalize allowed origins for exact comparison
    normalized_allowed = set()
    for o in allowed_origins:
        try:
            p = urlsplit(o.strip().lower())
            if p.scheme and p.netloc:
                normalized_allowed.add(f"{p.scheme}://{p.netloc}")
        except Exception:
            continue

    if normalized_origin not in normalized_allowed:
        return False, f"Untrusted origin '{normalized_origin}'."

    return True, "Valid Origin."

