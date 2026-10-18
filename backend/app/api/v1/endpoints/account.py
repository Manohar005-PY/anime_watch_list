from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserPreferencesUpdate
from app.schemas.stats import PersonalDataExport
from app.schemas.common import MessageResponse
from app.services.stats_service import StatsService
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/export", response_model=PersonalDataExport)
def export_account_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export complete personal viewing library and settings in structured JSON format."""
    return StatsService.export_user_data(db, current_user)


@router.patch("/preferences", response_model=UserResponse)
def update_preferences(
    prefs: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user interface and motion preferences."""
    current_prefs = dict(current_user.preferences or {})
    update_data = prefs.model_dump(exclude_unset=True)
    current_prefs.update(update_data)
    current_user.preferences = current_prefs
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("", response_model=MessageResponse)
def delete_user_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete user account and all associated anime entries, sessions, and data."""
    AuthService.delete_account(db, current_user, response)
    return MessageResponse(message="Account and all associated personal data permanently deleted.")
