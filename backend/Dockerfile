# ==============================================================================
# Stage 1: Build virtual environment with dependencies
# ==============================================================================
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies for psycopg2 and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Stage 2: Minimal runtime image
# ==============================================================================
FROM python:3.12-slim-bookworm AS runner

WORKDIR /app

# Install runtime libpq for PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user
RUN groupadd -g 10001 kage && \
    useradd -u 10001 -g kage -s /bin/bash -m kage

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy application code and migrations
COPY --chown=kage:kage alembic.ini .
COPY --chown=kage:kage alembic ./alembic
COPY --chown=kage:kage app ./app

# Set non-root user
USER kage

EXPOSE 8000

# Healthcheck using standard library urllib (no curl dependency needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').getcode() == 200 else 1)"

# Start server with graceful shutdown handling
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
