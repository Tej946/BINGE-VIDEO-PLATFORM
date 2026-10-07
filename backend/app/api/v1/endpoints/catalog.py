from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.schemas.catalog import CatalogSearchResult, UnifiedVideo
from app.services.catalog.engine import CatalogEngine
from app.services.catalog.base import CatalogSearchFilters

router = APIRouter()

def get_catalog_engine(db: AsyncSession = Depends(get_db)) -> CatalogEngine:
    """Dependency helper to create CatalogEngine with current server configuration."""
    return CatalogEngine(
        db=db,
        external_enabled=settings.EXTERNAL_CATALOG_ENABLED,
        api_key=settings.YOUTUBE_API_KEY,
        provider_type=settings.EXTERNAL_PROVIDER_TYPE
    )

@router.get("/search", response_model=CatalogSearchResult)
async def search_catalog(
    q: Optional[str] = Query(None, description="Search keyword or phrase"),
    spaces: Optional[str] = Query(None, description="Comma-separated space slugs for filtering"),
    sort_by: str = Query("relevance", description="Sort order: relevance, newest, views, duration"),
    limit: int = Query(24, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    source: Optional[str] = Query(None, description="Source filter: 'local', 'external', or omit for all"),
    engine: CatalogEngine = Depends(get_catalog_engine)
):
    """
    Search videos across the unified catalog.
    Aggregates local database videos and external privacy-preserving sources.
    Local search remains available even if the external catalog is unavailable.
    """
    space_list = [s.strip().lower() for s in spaces.split(",") if s.strip()] if spaces else []

    filters = CatalogSearchFilters(
        query=q.strip() if q else None,
        spaces=space_list,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
        source=source.strip().lower() if source else None
    )

    return await engine.search(filters)

@router.get("/video/{video_id}", response_model=UnifiedVideo)
async def get_catalog_video(
    video_id: str,
    engine: CatalogEngine = Depends(get_catalog_engine)
):
    """
    Retrieve unified video details by ID (supports local IDs like '1' and external IDs like 'ext_...').
    """
    video = await engine.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found in catalog")
    return video

@router.get("/status")
async def get_catalog_status(
    engine: CatalogEngine = Depends(get_catalog_engine)
):
    """
    Get current catalog configuration status.
    API keys are never exposed in this or any endpoint.
    """
    return {
        "external_enabled": settings.EXTERNAL_CATALOG_ENABLED,
        "provider_type": settings.EXTERNAL_PROVIDER_TYPE,
        "is_configured": engine.external_provider.is_configured,
        "catalog_mode": "hybrid" if engine.external_provider.is_configured else "local_only"
    }
