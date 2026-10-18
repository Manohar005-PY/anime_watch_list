from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
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

    # Database & Connection Pool Sizing (Cloud Run Scaled)
    DATABASE_URL: str = "postgresql://kage:kage_dev_secret@localhost:5432/kage_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 30
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
