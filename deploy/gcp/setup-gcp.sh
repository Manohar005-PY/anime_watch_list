#!/usr/bin/env bash
# ==============================================================================
# KAGE: Google Cloud Platform Infrastructure Provisioning & Setup Guide
# ==============================================================================
# Prerequisites:
# 1. Google Cloud SDK (gcloud) installed and authenticated: gcloud auth login
# 2. Configured Google Cloud project with active billing: gcloud projects create ${PROJECT_ID}
# ==============================================================================
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-YOUR_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO="${GAR_REPO:-kage-containers}"
CLOUD_SQL_INSTANCE="kage-postgres-prod"
DB_NAME="kage_db"
DB_USER="kage_admin"

# Dedicated IAM Service Account Identities
BACKEND_SA="kage-backend-sa"
MIGRATION_SA="kage-migration-sa"
FRONTEND_SA="kage-frontend-sa"

echo "=== 1. Setting Google Cloud Project ==="
gcloud config set project "${PROJECT_ID}"

echo "=== 2. Enabling Required Google Cloud APIs ==="
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com \
    iamcredentials.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com

echo "=== 3. Creating Regional Artifact Registry Repository ==="
gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for KAGE microservices" \
    || true

echo "=== 4. Creating Least-Privilege IAM Service Accounts ==="
# A. Backend Runtime Identity
gcloud iam service-accounts create "${BACKEND_SA}" \
    --display-name="KAGE Backend Cloud Run Runtime Identity" \
    || true
BACKEND_SA_EMAIL="${BACKEND_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

# B. Database Migration Job Identity (Used strictly during release runs)
gcloud iam service-accounts create "${MIGRATION_SA}" \
    --display-name="KAGE DB Migration Job Identity" \
    || true
MIGRATION_SA_EMAIL="${MIGRATION_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

# C. Frontend Runtime Identity (Minimal permissions: no DB or secret access needed)
gcloud iam service-accounts create "${FRONTEND_SA}" \
    --display-name="KAGE Frontend Cloud Run Identity" \
    || true
FRONTEND_SA_EMAIL="${FRONTEND_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Cloud SQL Client to Backend and Migration SAs
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${BACKEND_SA_EMAIL}" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${MIGRATION_SA_EMAIL}" \
    --role="roles/cloudsql.client"

echo "=== 5. Provisioning Cloud SQL PostgreSQL 16 Instance ==="
# Custom 1 vCPU, 3.75GB RAM (Tier db-custom-1-3840, PostgreSQL max_connections = 100)
# Web concurrency capped at maxScale 6 (48 peak connections) to guarantee 27+ buffer headroom.
gcloud sql instances create "${CLOUD_SQL_INSTANCE}" \
    --database-version=POSTGRES_16 \
    --tier=db-custom-1-3840 \
    --region="${REGION}" \
    --storage-type=SSD \
    --storage-size=20GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-point-in-time-recovery \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=04 \
    --deletion-protection \
    || true

echo "=== 6. Creating Database and User ==="
gcloud sql databases create "${DB_NAME}" --instance="${CLOUD_SQL_INSTANCE}" || true

DB_PASSWORD=$(openssl rand -base64 24)
gcloud sql users create "${DB_USER}" \
    --instance="${CLOUD_SQL_INSTANCE}" \
    --password="${DB_PASSWORD}" || true

echo "=== 7. Storing Production Secrets in Secret Manager ==="
CONNECTION_NAME=$(gcloud sql instances describe "${CLOUD_SQL_INSTANCE}" --format="value(connectionName)")
PROD_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# Generate cryptographically secure 64-byte hex random SECRET_KEY (128 characters / 512 bits)
PROD_SECRET_KEY=$(openssl rand -hex 64)
PROD_SCHEDULER_TOKEN=$(openssl rand -hex 32)

echo -n "${PROD_DB_URL}" | gcloud secrets create "KAGE_DATABASE_URL" --data-file=- || true
echo -n "${PROD_SECRET_KEY}" | gcloud secrets create "KAGE_SECRET_KEY" --data-file=- || true
echo -n "${PROD_SCHEDULER_TOKEN}" | gcloud secrets create "KAGE_SCHEDULER_SECRET_TOKEN" --data-file=- || true

# Placeholder for transactional SMTP provider password (e.g. SendGrid, Mailgun, Postmark API key)
gcloud secrets create "KAGE_SMTP_PASSWORD" --replication-policy="automatic" || true

# Grant secretAccessor role on specific secrets to backend runtime SA
for SECRET in KAGE_DATABASE_URL KAGE_SECRET_KEY KAGE_SCHEDULER_SECRET_TOKEN KAGE_SMTP_PASSWORD; do
    gcloud secrets add-iam-policy-binding "${SECRET}" \
        --member="serviceAccount:${BACKEND_SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" || true
done

# Grant migration SA access only to KAGE_DATABASE_URL
gcloud secrets add-iam-policy-binding "KAGE_DATABASE_URL" \
    --member="serviceAccount:${MIGRATION_SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" || true

echo "=== Setup complete! ==="
echo "Instance Connection Name: ${CONNECTION_NAME}"
echo "Backend Runtime Service Account: ${BACKEND_SA_EMAIL}"
echo "Migration Job Service Account: ${MIGRATION_SA_EMAIL}"
echo "Frontend Service Account: ${FRONTEND_SA_EMAIL}"
