from fastapi import APIRouter
from app.api.v1.endpoints import auth, anime, stats, account, import_routes, refresh_routes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(anime.router, prefix="/anime", tags=["anime"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(account.router, prefix="/account", tags=["account"])
api_router.include_router(import_routes.router, prefix="/import", tags=["import"])
api_router.include_router(refresh_routes.router, prefix="", tags=["refresh"])
