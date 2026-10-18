import time
import uuid
import logging
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)
logger = logging.getLogger("kage.app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A Cinematic Personal Anime Library API",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

# CORS middleware with credentials enabled for secure session cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)


@app.middleware("http")
async def security_and_timing_middleware(request: Request, call_next):
    """Assign correlation ID, enforce security headers, and measure latency."""
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.time()

    # Avoid logging sensitive request paths with parameters
    sanitized_path = request.url.path

    try:
        response: Response = await call_next(request)
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(
            f'Unhandled exception: method={request.method} path={sanitized_path} '
            f'request_id={request_id} duration_ms={duration_ms} error={str(exc)}'
        )
        # Avoid leaking internal stack trace in production
        detail = "An internal server error occurred." if settings.ENVIRONMENT == "production" else str(exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": detail, "request_id": request_id}
        )

    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(
        f'Request completed: method={request.method} path={sanitized_path} '
        f'status={response.status_code} request_id={request_id} duration_ms={duration_ms}'
    )

    # Set security headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

    return response


@app.get("/health", tags=["system"])
def health_check():
    """Liveness probe for Cloud Run and container orchestration."""
    return {"status": "healthy", "service": settings.PROJECT_NAME}


@app.get("/ready", tags=["system"])
def readiness_check():
    """Readiness probe that validates database connectivity without disclosing credentials."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        logger.error(f"Readiness database probe failed: {exc}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "unavailable"}
        )


# Register versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)
