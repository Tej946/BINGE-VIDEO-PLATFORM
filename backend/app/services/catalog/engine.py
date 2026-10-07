import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.catalog import UnifiedVideo, CatalogSearchResult
from app.services.catalog.base import CatalogSearchFilters
from app.services.catalog.local_provider import LocalVideoProvider
from app.services.catalog.external_provider import ExternalCatalogProvider

logger = logging.getLogger("binge.catalog.engine")

class CatalogEngine:
    """
    Central Catalog Engine for BINGE.
    Aggregates videos across local SQLite storage and external privacy-friendly catalogs.
    Guarantees local search availability even if the external provider is disabled or fails.
    """

    def __init__(
        self,
        db: AsyncSession,
        external_enabled: bool = True,
        api_key: Optional[str] = None,
        provider_type: str = "youtube"
    ):
        self.db = db
        self.local_provider = LocalVideoProvider(db)
        self.external_provider = ExternalCatalogProvider(
            enabled=external_enabled,
            api_key=api_key,
            provider_type=provider_type
        )

    async def search(self, filters: CatalogSearchFilters) -> CatalogSearchResult:
        sources_searched = []
        all_items: List[UnifiedVideo] = []

        # Determine catalog status
        if not self.external_provider.is_configured:
            catalog_status = "local_only"
        else:
            catalog_status = "active"

        # 1. Search Local Database
        if filters.source in (None, "all", "local"):
            try:
                local_results = await self.local_provider.search(filters)
                sources_searched.append("local")
                all_items.extend(local_results)
            except Exception as e:
                logger.error("Local catalog provider search error: %s", e)

        # 2. Search External Catalog (only if query present and external requested)
        if filters.query and filters.query.strip() and filters.source in (None, "all", "external"):
            if self.external_provider.is_configured:
                try:
                    external_results = await self.external_provider.search(filters)
                    if external_results:
                        sources_searched.append(self.external_provider.source_name)
                        all_items.extend(external_results)
                except Exception as e:
                    logger.warning("External catalog search failed, degrading status: %s", e)
                    catalog_status = "degraded"

        # 3. Deduplicate by external_id or id
        seen = set()
        deduped: List[UnifiedVideo] = []
        for item in all_items:
            key = item.external_id or item.id
            if key not in seen:
                seen.add(key)
                deduped.append(item)

        # 4. Final Ranking / Sorting
        if filters.sort_by == "views":
            deduped.sort(key=lambda x: x.views_count or 0, reverse=True)
        elif filters.sort_by == "newest":
            def get_timestamp(x: UnifiedVideo) -> float:
                if x.published_at:
                    return x.published_at.timestamp()
                if x.created_at:
                    return x.created_at.timestamp()
                return 0.0
            deduped.sort(key=get_timestamp, reverse=True)
        elif filters.sort_by == "duration":
            deduped.sort(key=lambda x: x.duration or 0, reverse=True)
        # For 'relevance', local provider already scored and external results maintain their relevance

        # 5. Apply pagination limit and offset
        total = len(deduped)
        paged_items = deduped[filters.offset : filters.offset + filters.limit]

        return CatalogSearchResult(
            items=paged_items,
            total=total,
            query=filters.query,
            sources_searched=sources_searched,
            spaces_filtered=filters.spaces,
            sort_by=filters.sort_by,
            catalog_status=catalog_status
        )

    async def get_video(self, video_id: str) -> Optional[UnifiedVideo]:
        """
        Get video details by ID, routing to appropriate provider.
        """
        if video_id.startswith("ext_"):
            return await self.external_provider.get_video(video_id)

        # Local video check
        local_v = await self.local_provider.get_video(video_id)
        if local_v:
            return local_v

        # Try external as fallback
        return await self.external_provider.get_video(video_id)

    async def get_related(self, video_id: str, limit: int = 8) -> List[UnifiedVideo]:
        if video_id.startswith("ext_"):
            return await self.external_provider.get_related(video_id, limit=limit)
        return await self.local_provider.get_related(video_id, limit=limit)

    async def get_creator_videos(self, creator_name: str, limit: int = 20) -> List[UnifiedVideo]:
        local_vids = await self.local_provider.get_creator_videos(creator_name, limit=limit)
        if len(local_vids) >= limit:
            return local_vids

        if self.external_provider.is_configured:
            try:
                ext_vids = await self.external_provider.get_creator_videos(creator_name, limit=limit - len(local_vids))
                return local_vids + ext_vids
            except Exception:
                return local_vids

        return local_vids
