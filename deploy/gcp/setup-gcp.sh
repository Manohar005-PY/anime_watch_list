#!/usr/bin/env bash
# ==============================================================================
# KAGE: Google Cloud Platform Infrastructure Provisioning & Setup Guide
# ==============================================================================
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-kage-anime-prod}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO="kage-containers"
CLOUD_SQL_INSTANCE="kage-postgres-prod"
DB_NAME="kage_db"
DB_USER="kage_admin"
SA_NAME="kage-cloudrun-runtime"

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

echo "=== 3. Creating Artifact Registry Repository ==="
gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for KAGE services" \
    || true

echo "=== 4. Creating Least-Privilege IAM Runtime Service Account ==="
gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="KAGE Cloud Run Runtime Service Account" \
    || true

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Cloud SQL Client and Secret Manager Secret Accessor
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"

echo "=== 5. Provisioning Cloud SQL PostgreSQL Instance ==="
# Enterprise edition, PostgreSQL 16, private IP or Cloud Run Proxy
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
PROD_SECRET_KEY=$(openssl rand -hex 32)

echo -n "${PROD_DB_URL}" | gcloud secrets create "KAGE_DATABASE_URL" --data-file=- || true
echo -n "${PROD_SECRET_KEY}" | gcloud secrets create "KAGE_SECRET_KEY" --data-file=- || true

echo "=== Setup complete! ==="
echo "Instance Connection Name: ${CONNECTION_NAME}"
echo "Runtime Service Account: ${SA_EMAIL}"
