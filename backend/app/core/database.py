from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Normalize postgres URL to support both psycopg v3 and psycopg2 seamlessly
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if database_url.startswith("postgresql://") and "+psycopg" not in database_url:
    try:
        import psycopg  # noqa: F401
    except ImportError:
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Engine configuration with connection pooling
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    connect_args=connect_args,
    # Sized for Cloud Run auto-scaled container instances (prevents Cloud SQL pool exhaustion)
    pool_size=settings.DB_POOL_SIZE if not database_url.startswith("sqlite") else 5,
    max_overflow=settings.DB_MAX_OVERFLOW if not database_url.startswith("sqlite") else 5,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
