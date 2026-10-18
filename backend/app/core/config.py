from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KAGE"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Security & Sessions
    SECRET_KEY: str = "dev-secret-key-change-in-production-kage-super-secret-key-minimum-32-chars"
    SESSION_COOKIE_NAME: str = "kage_session"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = "lax"
    SESSION_MAX_AGE_SECONDS: int = 60 * 60 * 24 * 7  # 7 days
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # CSRF & Origin Defense
    CSRF_COOKIE_NAME: str = "kage_csrf"
    ENFORCE_ORIGIN_CHECK: bool = True

    # Transactional Email (SMTP or Provider)
    EMAIL_ENABLED: bool = True
    EMAIL_PROVIDER: str = "console"  # "smtp", "console", "mock"
    SMTP_HOST: Union[str, None] = None
    SMTP_PORT: int = 587
    SMTP_USER: Union[str, None] = None
    SMTP_PASSWORD: Union[str, None] = None
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@kage.app"
    EMAILS_FROM_NAME: str = "KAGE Anime Library"
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate limiting
    RATE_LIMIT_LOGIN_MAX: int = 5
    RATE_LIMIT_WINDOW_SECONDS: int = 300

    # Metadata Provider & Scheduled Refresh
    METADATA_PROVIDER: str = "kitsu"  # "kitsu", "mock"
    SCHEDULER_SECRET_TOKEN: str = "dev-scheduler-secret-token-change-in-production"
    METADATA_REFRESH_BATCH_SIZE: int = 50

    # Documented Cloud SQL Connection Budget Calculation:
    # Cloud SQL Tier (db-custom-1-3840, 3.75GB RAM) PostgreSQL max_connections = 100
    # Reserve for PostgreSQL superuser & replication: 5 connections
    # Reserve for DBA / psql / Cloud SQL Auth proxy monitoring: 10 connections
    # Reserve for Cloud Run Jobs (Alembic release migrations & metadata refresh cron): 10 connections
    # Net available for Cloud Run Web Service = 75 connections max.
    # Cloud Run Web Service configuration:
    # - 1 uvicorn worker process per container (concurrency handled by Cloud Run)
    # - Cloud Run autoscaling maxScale: 6 instances (max 8 in rolling deploy bursts)
    # - Pool size per instance: 4 steady-state + 4 overflow = 8 connections max per container.
    # - Total peak web pool = 6 instances * 8 connections = 48 connections (well under 75 ceiling).
    # - Headroom remaining: 75 - 48 = 27 connections (36% buffer).
    DATABASE_URL: str = "postgresql://kage:kage_dev_secret@localhost:5432/kage_db"
    DB_POOL_SIZE: int = 4
    DB_MAX_OVERFLOW: int = 4
    DB_POOL_TIMEOUT: int = 15
    DB_POOL_RECYCLE: int = 1800

    # CORS
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="after")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        return []

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """Strict production configuration integrity validation."""
        if self.ENVIRONMENT == "production":
            # 1. Enforce strong, non-default SECRET_KEY (min 64 hex characters / 256-bit entropy)
            insecure_patterns = ["dev-secret-key", "replace-with", "change-in-production", "secret"]
            if not self.SECRET_KEY or any(p in self.SECRET_KEY.lower() for p in insecure_patterns):
                raise ValueError(
                    "Insecure or default SECRET_KEY detected in production environment! "
                    "Generate a cryptographically secure 64-byte key using 'openssl rand -hex 64'."
                )
            if len(self.SECRET_KEY) < 64:
                raise ValueError(
                    f"Production SECRET_KEY must be at least 64 characters (found {len(self.SECRET_KEY)}). "
                    "Generate using 'openssl rand -hex 64'."
                )

            # 2. Enforce secure cookies in production
            if not self.SESSION_COOKIE_SECURE:
                self.SESSION_COOKIE_SECURE = True

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
