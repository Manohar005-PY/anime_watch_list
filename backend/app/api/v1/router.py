from fastapi import APIRouter
from app.api.v1.endpoints import auth, anime, stats, account

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(anime.router, prefix="/anime", tags=["anime"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
