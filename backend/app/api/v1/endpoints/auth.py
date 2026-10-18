from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user, get_token_from_request
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    AuthResponse,
    CsrfTokenResponse
)
from app.schemas.user import UserResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.core.security import generate_csrf_token

router = APIRouter()


@router.get("/csrf-token", response_model=CsrfTokenResponse)
def get_csrf_token(
    request: Request,
    response: Response
):
    """
    Retrieve or bootstrap a signed CSRF token.
    Protected by exact-origin policy on mutations and credentialed CORS.
    If authenticated via session cookie, token is cryptographically bound to the active session.
    If unauthenticated, token is signed with an ephemeral pre-auth nonce.
    Sets the host-only cookie and returns the token in JSON.
    """
    session_cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    csrf_token = generate_csrf_token(session_token=session_cookie)
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=False,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/"
    )
    return CsrfTokenResponse(csrf_token=csrf_token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    request_data: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user account with Argon2id password hashing."""
    client_ip = request.client.host if request.client else "unknown"
    user = AuthService.register_user(db, request_data, client_ip)
    return user


@router.post("/login", response_model=AuthResponse)
def login(
    request_data: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate with email and password, setting a secure HttpOnly session cookie and returning session-bound CSRF token."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent")
    user, token, csrf_token = AuthService.login_user(db, request_data, client_ip, user_agent, response)
    return AuthResponse(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        message="Login successful",
        csrf_token=csrf_token
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Invalidate current session and clear session cookie."""
    token = get_token_from_request(request)
    AuthService.logout_user(db, token, response)
    return MessageResponse(message="Successfully logged out.")


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieve the currently authenticated user's profile."""
    return current_user


@router.post("/password-reset/request", response_model=MessageResponse)
def request_password_reset(
    request_data: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request password reset. Returns generic message to prevent account enumeration."""
    client_ip = request.client.host if request.client else "unknown"
    token = AuthService.request_password_reset(db, request_data, client_ip)
    # Production security guarantee: Never expose reset tokens in responses or logs
    detail = f"Dev reset token: {token}" if (token and settings.ENVIRONMENT != "production") else None
    return MessageResponse(
        message="If an account exists with that email, password reset instructions have been sent.",
        detail=detail
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(
    request_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset using single-use token and rotate sessions."""
    AuthService.confirm_password_reset(db, request_data)
    return MessageResponse(message="Password reset successfully. You may now log in.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    request_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password and invalidate all other sessions."""
    token = get_token_from_request(request)
    AuthService.change_password(db, current_user, request_data, token)
    return MessageResponse(message="Password changed successfully.")
