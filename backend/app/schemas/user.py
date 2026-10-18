from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    preferences: Dict[str, Any] = {}
    created_at: datetime


class UserPreferencesUpdate(BaseModel):
    display_mode: Optional[str] = None  # "grid" or "list"
    reduce_motion: Optional[bool] = None
    theme: Optional[str] = None  # "obsidian", "charcoal", "high-contrast"
    default_sort: Optional[str] = None
    default_filter: Optional[str] = None
