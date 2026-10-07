import re
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.video import Video
from app.schemas.catalog import UnifiedVideo
from app.schemas.space import SpaceResponse
from app.services.catalog.base import BaseVideoProvider, CatalogSearchFilters

class LocalVideoProvider(BaseVideoProvider):
    """
    Provider for locally hosted & uploaded videos stored in SQLite database.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    @property
    def source_name(self) -> str:
        return "local"

    def _to_unified(self, v: Video) -> UnifiedVideo:
        spaces_resp = [
            SpaceResponse(
                id=s.id,
                slug=s.slug,
                name=s.name,
                icon=s.icon,
                color=s.color,
                description=s.description,
                is_default=s.is_default,
                created_at=s.created_at,
                video_count=0
            )
            for s in (v.spaces or [])
        ]

        return UnifiedVideo(
            id=str(v.id),
            title=v.title,
            description=v.description,
            video_path=v.video_path,
            thumbnail_path=v.thumbnail_path,
            duration=v.duration or 0,
            views_count=v.views_count or 0,
            resolution=v.resolution or "480p",
            creator_name=v.creator_name or "Creator",
            creator_id=None,
            tags=v.tags,
            source=v.source or "local",
            external_id=v.external_id,
            playback_type=v.playback_type or "direct_stream",
            embed_url=v.embed_url,
            license=v.license or "Standard",
            published_at=v.published_at or v.created_at,
            created_at=v.created_at,
            spaces=spaces_resp
        )

    def _calculate_relevance(self, video: Video, query: str) -> int:
        """
        Calculate transparent relevance score for search ranking.
        No hidden black-box recommendations.
        """
        if not query:
            return 0

        score = 0
        q = query.lower().strip()
        words = [w for w in re.split(r'\s+', q) if len(w) > 1]

        title = (video.title or "").lower()
        creator = (video.creator_name or "").lower()
        tags = (video.tags or "").lower()
        desc = (video.description or "").lower()

        # Exact title match
        if q == title:
            score += 150
        elif title.startswith(q):
            score += 80
        elif q in title:
            score += 50

        # Creator match
        if q == creator:
            score += 100
        elif q in creator:
            score += 40

        # Tags match
        if q in tags:
            score += 35

        # Description match
        if q in desc:
            score += 15

        # Individual word matches for multi-word queries
        for word in words:
            if word in title:
                score += 20
            if word in creator:
                score += 15
            if word in tags:
                score += 10
            if word in desc:
                score += 5

        return score

    async def search(self, filters: CatalogSearchFilters) -> List[UnifiedVideo]:
        query = select(Video).options(selectinload(Video.spaces))
        result = await self.db.execute(query)
        videos = result.scalars().all()

        # 1. Filter by Spaces
        if filters.spaces:
            filter_slugs = set(s.strip().lower() for s in filters.spaces if s.strip())
            if filter_slugs:
                filtered = []
                for v in videos:
                    v_slugs = {sp.slug.lower() for sp in (v.spaces or [])}
                    if filter_slugs.intersection(v_slugs):
                        filtered.append(v)
                videos = filtered

        # 2. Filter & Score by Search Query (Case-insensitive, partial matching)
        scored_videos = []
        if filters.query and filters.query.strip():
            q = filters.query.strip().lower()
            for v in videos:
                score = self._calculate_relevance(v, q)
                if score > 0:
                    scored_videos.append((v, score))
        else:
            scored_videos = [(v, 0) for v in videos]

        # 3. Sort
        if filters.sort_by == "relevance" and filters.query:
            scored_videos.sort(key=lambda item: (item[1], item[0].views_count or 0), reverse=True)
        elif filters.sort_by == "newest":
            scored_videos.sort(key=lambda item: (item[0].created_at.timestamp() if item[0].created_at else float(item[0].id or 0)), reverse=True)
        elif filters.sort_by == "views":
            scored_videos.sort(key=lambda item: (item[0].views_count or 0), reverse=True)
        elif filters.sort_by == "duration":
            scored_videos.sort(key=lambda item: (item[0].duration or 0), reverse=True)
        else:
            # Default newest
            scored_videos.sort(key=lambda item: item[0].id, reverse=True)

        # 4. Paginate
        paginated = scored_videos[filters.offset : filters.offset + filters.limit]

        return [self._to_unified(v) for v, _ in paginated]

    async def get_video(self, video_id: str) -> Optional[UnifiedVideo]:
        # Handle "local_1" or "1"
        raw_id = video_id.replace("local_", "") if video_id.startswith("local_") else video_id
        if not raw_id.isdigit():
            return None

        result = await self.db.execute(
            select(Video).options(selectinload(Video.spaces)).where(Video.id == int(raw_id))
        )
        v = result.scalar_one_or_none()
        if not v:
            return None

        # Increment views count
        v.views_count = (v.views_count or 0) + 1
        await self.db.commit()

        return self._to_unified(v)

    async def get_related(self, video_id: str, limit: int = 10) -> List[UnifiedVideo]:
        current = await self.get_video(video_id)
        if not current:
            return []

        all_res = await self.db.execute(select(Video).options(selectinload(Video.spaces)))
        all_videos = all_res.scalars().all()

        current_slugs = {s.slug for s in current.spaces}
        current_tags = set(t.strip().lower() for t in (current.tags or "").split(",") if t.strip())

        scored = []
        for v in all_videos:
            if str(v.id) == str(current.id):
                continue
            score = 0
            if v.creator_name and v.creator_name.lower() == current.creator_name.lower():
                score += 50
            v_slugs = {s.slug for s in (v.spaces or [])}
            shared_spaces = current_slugs.intersection(v_slugs)
            score += len(shared_spaces) * 20
            v_tags = set(t.strip().lower() for t in (v.tags or "").split(",") if t.strip())
            shared_tags = current_tags.intersection(v_tags)
            score += len(shared_tags) * 10

            if score > 0:
                scored.append((v, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [self._to_unified(v) for v, _ in scored[:limit]]

    async def get_creator_videos(self, creator_id_or_name: str, limit: int = 20) -> List[UnifiedVideo]:
        q = creator_id_or_name.strip().lower()
        res = await self.db.execute(
            select(Video).options(selectinload(Video.spaces)).order_by(Video.id.desc())
        )
        videos = res.scalars().all()
        matched = [v for v in videos if (v.creator_name or "").strip().lower() == q]
        return [self._to_unified(v) for v in matched[:limit]]
