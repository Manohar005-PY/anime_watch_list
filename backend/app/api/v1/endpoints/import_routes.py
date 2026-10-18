from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.import_job import ImportJob
from app.schemas.import_schemas import (
    ParseImportRequest,
    ParseImportResponse,
    CreateImportJobRequest,
    ImportJobResponse,
    ImportJobItemResponse,
    ImportItemUpdate,
    DuplicateActionMap,
)
from app.services.import_service import ImportService

router = APIRouter()


@router.post("/parse", response_model=ParseImportResponse)
def parse_import(
    payload: ParseImportRequest,
    current_user: User = Depends(get_current_user),
):
    """Parse raw multiline text or CSV file content for preview before creating a job."""
    return ImportService.parse_input(payload.text_content or "", payload.file_type)


@router.post("/jobs", response_model=ImportJobResponse, status_code=status.HTTP_201_CREATED)
async def create_import_job(
    payload: CreateImportJobRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new bulk import job and trigger metadata enrichment discovery."""
    try:
        job = await ImportService.create_import_job(db=db, user_id=current_user.id, request=payload)
        return job
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/jobs/{job_id}", response_model=ImportJobResponse)
def get_import_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve an import job and its items. Scoped strictly to the current user."""
    job = db.query(ImportJob).filter(ImportJob.id == job_id, ImportJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found")
    return job


@router.patch("/jobs/{job_id}/items/{item_id}", response_model=ImportJobItemResponse)
def update_import_item(
    job_id: str,
    item_id: str,
    payload: ImportItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a specific import item (select alternate candidate, toggle skip, edit title)."""
    try:
        item = ImportService.update_item(
            db=db,
            user_id=current_user.id,
            job_id=job_id,
            item_id=item_id,
            update_data=payload,
        )
        return item
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/jobs/{job_id}/confirm", response_model=ImportJobResponse)
def confirm_import_job(
    job_id: str,
    payload: DuplicateActionMap,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply duplicate resolutions and finalize transaction import into user collection."""
    try:
        job = ImportService.confirm_import_job(
            db=db,
            user_id=current_user.id,
            job_id=job_id,
            duplicate_actions=payload.actions,
        )
        return job
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/jobs/{job_id}/cancel", response_model=ImportJobResponse)
def cancel_import_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an active or pending import job."""
    try:
        job = ImportService.cancel_job(db=db, user_id=current_user.id, job_id=job_id)
        return job
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
