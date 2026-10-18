from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.stats import UserStatsResponse
from app.services.stats_service import StatsService

router = APIRouter()


@router.get("", response_model=UserStatsResponse)
def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve personal viewing statistics calculated solely from the user's records."""
    return StatsService.get_user_stats(db, current_user.id)
