# KAGE — A Cinematic Personal Anime Library

```
[ 影 KAGE ] — Personal Anime Collection & Tracking System
Monochrome Editorial Aesthetics // Zero Fabricated Data // Strict Ownership Isolation
```

KAGE is a personal anime tracking and collection archive built for media enthusiasts who appreciate tactile typography, monochrome manga panel composition, and serious data ownership.

Unlike standard watchlist sites filled with generic neon templates, advertisements, social noise, and fake review aggregates, KAGE focuses strictly on personal library curation: authentic progress tracking, private notes, score curves, and mathematically derived telemetry.

---

## 1. System Architecture & Topology

```
[ Browser Client ]
       │  (HTTPS / Secure HttpOnly Session Cookie)
       ▼
[ Cloud Run / Ingress ] ──> [ Next.js 15+ Frontend (Port 3000) ]
       │                            │
       │                            ▼ (Typed REST API)
       └──────────────────> [ FastAPI Backend (Port 8000) ]
                                    │
                                    ▼ (SQLAlchemy 2.0 / Alembic)
                            [ PostgreSQL 16 Database ]
```

### Component Boundaries
- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript (Strict), Tailwind CSS, Framer Motion, GSAP 3, Lucide React, Zod.
- **Backend API**: Python 3.12/3.14 with FastAPI, Pydantic V2, SQLAlchemy 2.0 ORM, Alembic migrations, Argon2id (`argon2-cffi`).
- **Data Persistence**: PostgreSQL 16 with relational integrity constraints, foreign key cascades, and composite indexes.
- **Infrastructure & Cloud**: Docker multi-stage non-root containers, Docker Compose for local environments, Google Cloud Run, Cloud SQL, Secret Manager, Cloud Logging, and keyless GitHub Actions CI/CD via Workload Identity Federation.

---

## 2. Threat Model & Security Controls

| Security Boundary | Control Implementation |
| :--- | :--- |
| **Authentication & Password Storage** | Memory-hard **Argon2id** password hashing ($m=65536, t=3, p=4$) preventing GPU-assisted cracking. Rate limiting on registration, login, and password resets. |
| **Session Management** | Cryptographically secure 256-bit opaque tokens (`secrets.token_urlsafe(32)`). Stored in the database as SHA-256 hashes. Delivered to browsers exclusively via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies. Session rotation upon login and password reset. |
| **Ownership Isolation (IDOR Defense)** | Client-supplied user identifiers are **never** trusted. The user identity is extracted solely from the validated session. Every query in `AnimeService` and `StatsService` enforces `WHERE user_id = :authenticated_user_id`. Any unauthorized access returns `404 Not Found` to prevent resource enumeration. |
| **SSRF Prevention** | Poster URLs are strictly validated: requires `https://` protocol and rejects loopback (`127.0.0.1`, `localhost`), link-local/cloud metadata (`169.254.169.254`, `metadata.google.internal`), and RFC 1918 private subnets (`10.0.0.0/8`, `192.168.0.0/16`). |
| **SQL Injection & XSS** | Parametrized SQLAlchemy 2.0 queries across all routes. Strict Content-Security-Policy headers, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`. |
| **Account Enumeration** | Timing-consistent responses. Login returns `"Invalid email or password"`. Password reset requests return generic confirmation regardless of email existence. |

---

## 3. Database Schema & Alembic Migrations

```
users (id PK, email UK, password_hash, is_active, is_verified, display_name, preferences JSON, created_at, updated_at)
  │
  ├──< sessions (id PK, user_id FK, session_token_hash UK, user_agent, ip_address, expires_at, created_at, last_accessed_at)
  ├──< password_resets (id PK, user_id FK, token_hash UK, expires_at, is_used, created_at)
  └──< anime_entries (id PK, user_id FK, title, normalized_title, alternate_title, poster_url, status, total_episodes, watched_episodes, rating, notes, is_favorite, genres JSON, started_at, completed_at, created_at, updated_at)
```

### Relational Constraints
- Unique composite index `(user_id, normalized_title)`: Prevents accidental duplicate entries by the same user while allowing independent tracking across multiple users.
- Check constraint `watched_episodes >= 0` and application validation `watched_episodes <= total_episodes` (when total is known).
- Check constraint `rating IS NULL OR (rating >= 1 AND rating <= 10)`.
- Cascading deletion: Deleting a user account cascades to all user anime entries, sessions, and reset tokens.

---

## 4. Local Development Quickstart

### Prerequisites
- Docker & Docker Compose (v2+)
- (Optional for native development) Python 3.12+ and Node.js 20+

### Start Full Stack Locally via Docker Compose
```bash
# Clone the repository
git clone https://github.com/your-org/kage.git
cd kage

# Launch PostgreSQL 16, FastAPI backend, and Next.js frontend
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`
- Readiness check: `http://localhost:8000/ready`

### Native Development Setup

#### Backend:
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 5. Automated Test Suite

The test suite validates authentication, business logic, episode tracking bounds, SSRF defenses, and cross-user data isolation.

```bash
cd backend
# Run all tests with verbose output
pytest -v
```

### Automated Test Coverage
- `test_auth.py`: Registration, duplicate email rejection, Argon2id verification, session cookie issuance, password reset single-use token lifecycle, and session invalidation.
- `test_anime.py`: CRUD operations, episode tracking boundaries (`watched <= total`), automatic completion transitions, favorite toggling, and multi-field filtering.
- `test_security_isolation.py`: Explicit IDOR tests proving User A cannot read, edit, delete, or aggregate User B's entries, independent tracking of identical titles across users, and SSRF poster URL blocking.
- `test_account.py`: Preference updates, complete JSON data export, and cascading account deletion.

---

## 6. Motion Design System & Tokens

KAGE implements an editorial motion system balancing tactile feedback with accessibility:

- **Tokens** (`frontend/src/lib/motion-tokens.ts`):
  - Fast: `0.15s` (buttons, checkboxes, favorite star toggles)
  - Editorial Reveal: `0.28s`, ease: `[0.16, 1, 0.3, 1]`
  - Cinematic Reveal: `0.65s`, ease: `[0.25, 1, 0.5, 1]`
  - Spring: `stiffness: 400, damping: 30`
- **Accessibility & Reduced Motion**:
  - Automatically respects `prefers-reduced-motion: reduce`.
  - Application-level toggle in User Settings (`reduce_motion: true`).
  - When enabled, transitions collapse to instant or subtle opacity fades (`0.01s`), neutralizing all transforms and parallax.

---

## 7. Google Cloud Production Deployment

### Target GCP Architecture
- **Compute**: Google Cloud Run (`kage-web` and `kage-api` services)
- **Database**: Google Cloud SQL (PostgreSQL 16 Enterprise, automated backups, point-in-time recovery)
- **Image Registry**: Google Artifact Registry (`kage-containers`)
- **Secrets Management**: Google Secret Manager (`KAGE_DATABASE_URL`, `KAGE_SECRET_KEY`)
- **Identity**: Least-privilege runtime service account (`kage-cloudrun-runtime`)
- **CI/CD**: Keyless GitHub Actions via Workload Identity Federation

### Deployment Steps
```bash
# 1. Run the GCP infrastructure setup script
chmod +x deploy/gcp/setup-gcp.sh
./deploy/gcp/setup-gcp.sh

# 2. Build and push container images
gcloud auth configure-docker us-central1-docker.pkg.dev
docker build -t us-central1-docker.pkg.dev/${PROJECT_ID}/kage-containers/kage-backend:latest ./backend
docker build -t us-central1-docker.pkg.dev/${PROJECT_ID}/kage-containers/kage-frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/${PROJECT_ID}/kage-containers/kage-backend:latest
docker push us-central1-docker.pkg.dev/${PROJECT_ID}/kage-containers/kage-frontend:latest

# 3. Execute database migration job
gcloud run jobs create kage-db-migrate \
  --image=us-central1-docker.pkg.dev/${PROJECT_ID}/kage-containers/kage-backend:latest \
  --command=alembic,upgrade,head \
  --set-secrets=DATABASE_URL=KAGE_DATABASE_URL:latest \
  --region=us-central1
gcloud run jobs execute kage-db-migrate --region=us-central1 --wait

# 4. Deploy Backend and Frontend Cloud Run services
gcloud run services replace deploy/gcp/cloudrun-backend.yaml --region=us-central1
gcloud run services replace deploy/gcp/cloudrun-frontend.yaml --region=us-central1
```

### Rollback & Disaster Recovery
- **Cloud Run Instant Rollback**: Revert to previous known-good revision with zero downtime:
  ```bash
  gcloud run services update-traffic kage-api --to-revisions=PREVIOUS_REVISION=100
  ```
- **Database Point-in-Time Recovery**: Restore Cloud SQL database to any minute within the 7-day retention window:
  ```bash
  gcloud sql instances clone kage-postgres-prod kage-postgres-restore --point-in-time="2026-10-18T20:00:00Z"
  ```

---

## 8. Cost Considerations

- **Cloud Run**: Scales to zero when idle ($0 compute during inactive periods).
- **Cloud SQL**: Smallest production tier (`db-custom-1-3840`) runs 24/7 (~$40-$50/month). For development, scale down or pause the instance when inactive.
- **Artifact Registry**: Minimal storage cost (~$0.10/GB/month).
- **Secret Manager**: Free tier covers first 6 active secret versions and 10,000 access operations.

---

## 9. License

KAGE is open-source software licensed under the MIT License.
