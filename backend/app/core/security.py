import hashlib
import secrets
import time
from collections import defaultdict
from typing import Dict, List
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
