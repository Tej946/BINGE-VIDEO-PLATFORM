from fastapi import APIRouter
from app.api.v1.endpoints import health, spaces, videos, catalog, privacy

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(spaces.router, prefix="/spaces", tags=["Spaces"])
api_router.include_router(videos.router, prefix="/videos", tags=["Videos"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(privacy.router, prefix="/privacy", tags=["Privacy"])
