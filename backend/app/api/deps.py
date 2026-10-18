from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService


def get_token_from_request(request: Request) -> Optional[str]:
    """Extract session token from HttpOnly cookie or Authorization Bearer header."""
    # 1. Primary: Session cookie
    cookie_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    # 2. Secondary: Bearer token header (useful for API clients & test suite)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "").strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Dependency that ensures request is authenticated and returns active User."""
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )

    user = AuthService.get_current_user_from_token(db, token)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please log in again."
        )

    return user


def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency that returns active User if authenticated, else None."""
    token = get_token_from_request(request)
    if not token:
        return None
    return AuthService.get_current_user_from_token(db, token)
