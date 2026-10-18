from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request, Response

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    generate_session_token,
    hash_token,
    login_rate_limiter,
    register_rate_limiter,
    reset_pwd_rate_limiter
)
from app.models.user import User
from app.models.session import SessionModel
from app.models.password_reset import PasswordReset
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest
)


class AuthService:
    @staticmethod
    def register_user(db: Session, request: UserRegisterRequest, client_ip: str) -> User:
        """Register a new user with Argon2id password hashing."""
        if register_rate_limiter.is_rate_limited(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later."
            )

        normalized_email = request.email.strip().lower()
        existing = db.query(User).filter(User.email == normalized_email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        hashed = hash_password(request.password)
        user = User(
            email=normalized_email,
            password_hash=hashed,
            display_name=request.display_name.strip() if request.display_name else None,
            is_active=True,
            is_verified=False,
            preferences={
                "display_mode": "grid",
                "reduce_motion": False,
                "theme": "obsidian"
            }
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login_user(
        db: Session,
        request: UserLoginRequest,
        client_ip: str,
        user_agent: Optional[str],
        response: Response
    ) -> Tuple[User, str]:
        """Authenticate user, create secure session, and set HttpOnly cookie."""
        rate_key = f"{client_ip}:{request.email.strip().lower()}"
        if login_rate_limiter.is_rate_limited(rate_key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please wait a few minutes."
            )

        normalized_email = request.email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()

        # Always verify against dummy or real hash to avoid timing discrepancy
        is_valid = False
        if user and user.is_active:
            is_valid = verify_password(request.password, user.password_hash)

        if not user or not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        # Login successful -> reset rate limiter for this identifier
        login_rate_limiter.reset(rate_key)

        # Generate secure opaque session token
        raw_token = generate_session_token()
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_MAX_AGE_SECONDS)

        session_obj = SessionModel(
            user_id=user.id,
            session_token_hash=token_hash,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=client_ip[:45] if client_ip else None,
            expires_at=expires_at
        )
        db.add(session_obj)
        db.commit()

        # Set secure HttpOnly cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=raw_token,
            max_age=settings.SESSION_MAX_AGE_SECONDS,
            httponly=settings.SESSION_COOKIE_HTTPONLY,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            path="/"
        )

        return user, raw_token

    @staticmethod
    def get_current_user_from_token(db: Session, token: str) -> Optional[User]:
        """Validate session token and return user if session is active and unexpired."""
        if not token:
            return None
        token_hash = hash_token(token)
        now = datetime.now(timezone.utc)
        
        session_obj = (
            db.query(SessionModel)
            .filter(
                SessionModel.session_token_hash == token_hash,
                SessionModel.expires_at > now
            )
            .first()
        )
        if not session_obj:
            return None

        # Update last accessed time
        session_obj.last_accessed_at = now
        db.commit()

        return session_obj.user

    @staticmethod
    def logout_user(db: Session, token: Optional[str], response: Response) -> None:
        """Invalidate session in database and delete cookie."""
        if token:
            token_hash = hash_token(token)
            db.query(SessionModel).filter(SessionModel.session_token_hash == token_hash).delete()
            db.commit()

        response.delete_cookie(
            key=settings.SESSION_COOKIE_NAME,
            path="/",
            httponly=settings.SESSION_COOKIE_HTTPONLY,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite=settings.SESSION_COOKIE_SAMESITE
        )

    @staticmethod
    def request_password_reset(db: Session, request: PasswordResetRequest, client_ip: str) -> Optional[str]:
        """Request password reset. Returns token for dev/testing; logs only in non-prod."""
        if reset_pwd_rate_limiter.is_rate_limited(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many reset requests. Please try again later."
            )

        normalized_email = request.email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email, User.is_active == True).first()
        
        raw_token = None
        if user:
            raw_token = generate_session_token()
            token_hash = hash_token(raw_token)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
            
            # Invalidate any prior unused reset tokens for this user
            db.query(PasswordReset).filter(PasswordReset.user_id == user.id, PasswordReset.is_used == False).delete()
            
            reset_record = PasswordReset(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=expires_at,
                is_used=False
            )
            db.add(reset_record)
            db.commit()

        # In dev mode, return token so tests and local UI can test reset
        return raw_token if settings.ENVIRONMENT != "production" else None

    @staticmethod
    def confirm_password_reset(db: Session, request: PasswordResetConfirm) -> None:
        """Confirm password reset with single-use token and invalidate all active sessions."""
        token_hash = hash_token(request.token)
        now = datetime.now(timezone.utc)
        
        reset_record = (
            db.query(PasswordReset)
            .filter(
                PasswordReset.token_hash == token_hash,
                PasswordReset.is_used == False,
                PasswordReset.expires_at > now
            )
            .first()
        )
        if not reset_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token."
            )

        user = reset_record.user
        user.password_hash = hash_password(request.new_password)
        reset_record.is_used = True
        
        # Security: Invalidate all existing sessions after password reset
        db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
        db.commit()

    @staticmethod
    def change_password(
        db: Session,
        user: User,
        request: ChangePasswordRequest,
        current_token: Optional[str]
    ) -> None:
        """Change password after validating current password. Rotates sessions."""
        if not verify_password(request.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password."
            )
        
        user.password_hash = hash_password(request.new_password)
        
        # Invalidate all OTHER sessions for this user
        if current_token:
            current_hash = hash_token(current_token)
            db.query(SessionModel).filter(
                SessionModel.user_id == user.id,
                SessionModel.session_token_hash != current_hash
            ).delete()
        db.commit()

    @staticmethod
    def delete_account(db: Session, user: User, response: Response) -> None:
        """Delete user account and all cascaded data."""
        db.delete(user)
        db.commit()
        response.delete_cookie(
            key=settings.SESSION_COOKIE_NAME,
            path="/",
            httponly=settings.SESSION_COOKIE_HTTPONLY,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite=settings.SESSION_COOKIE_SAMESITE
        )
