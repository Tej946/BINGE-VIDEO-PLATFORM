import re
import html
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx

from app.schemas.catalog import UnifiedVideo
from app.services.catalog.base import BaseVideoProvider, CatalogSearchFilters

logger = logging.getLogger("binge.catalog.external")

# Known public privacy-friendly Invidious instances (used only if provider_type == 'invidious')
DEFAULT_INVIDIOUS_INSTANCES = [
    "https://inv.tux.pizza",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
    "https://vid.puffyan.us"
]

def parse_iso8601_duration(duration_str: str) -> int:
    """
    Parse an ISO 8601 duration string (e.g. 'PT1H2M10S', 'PT4M33S', 'PT45S')
    into total duration in seconds.
    """
    if not duration_str or not duration_str.startswith("PT"):
        return 0
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

class ExternalCatalogProvider(BaseVideoProvider):
    """
    Configurable External Catalog Provider for BINGE.
    Enables aggregating real-world videos without user profiling or tracking cookies.
    Automatically disables external search if no API credentials are provided,
    and catches all network errors to ensure local search is never interrupted.
    """

    def __init__(
        self,
        enabled: bool = True,
        api_key: Optional[str] = None,
        provider_type: str = "youtube",
        instances: Optional[List[str]] = None,
        timeout: float = 6.0
    ):
        self.enabled = enabled
        self.api_key = api_key.strip() if api_key and api_key.strip() else None
        self.provider_type = (provider_type or "youtube").lower()
        self.instances = instances or DEFAULT_INVIDIOUS_INSTANCES
        self.timeout = timeout

    @property
    def source_name(self) -> str:
        return self.provider_type if self.provider_type else "external"

    @property
    def is_configured(self) -> bool:
        """
        Check if the external provider has valid configuration to run queries.
        If YouTube is selected but no API key is provided, returns False.
        """
        if not self.enabled:
            return False
        if self.provider_type == "youtube":
            return bool(self.api_key)
        if self.provider_type == "invidious":
            return bool(self.instances)
        return False

    async def search(self, filters: CatalogSearchFilters) -> List[UnifiedVideo]:
        """
        Execute external catalog search. Returns empty list if unconfigured,
        disabled, or if any upstream network failure occurs.
        """
        if not self.enabled or not self.is_configured:
            return []

        if not filters.query or not filters.query.strip():
            return []

        if self.provider_type == "youtube":
            return await self._search_youtube(filters)
        elif self.provider_type == "invidious":
            return await self._search_invidious(filters)
        return []

    async def _search_youtube(self, filters: CatalogSearchFilters) -> List[UnifiedVideo]:
        """Search videos via official YouTube Data API v3 with privacy-preserving embed output."""
        if not self.api_key:
            return []

        q = filters.query.strip()
        sort_map = {
            "relevance": "relevance",
            "views": "viewCount",
            "newest": "date"
        }
        order = sort_map.get(filters.sort_by, "relevance")
        max_results = min(max(filters.limit, 1), 50)

        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": q,
            "type": "video",
            "maxResults": max_results,
            "order": order,
            "key": self.api_key
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    logger.warning(
                        "YouTube API search error (status %s): %s",
                        resp.status_code,
                        resp.text[:200]
                    )
                    return []

                data = resp.json()
                items = data.get("items", [])
                if not items:
                    return []

                # Extract valid video IDs for batched metadata enrichment
                v_ids = [
                    item.get("id", {}).get("videoId")
                    for item in items
                    if item.get("id", {}).get("videoId")
                ]

                # Secondary batched enrichment: duration, view counts, and embeddable status (1 quota cost)
                details_map: Dict[str, Dict[str, Any]] = {}
                if v_ids:
                    try:
                        v_url = "https://www.googleapis.com/youtube/v3/videos"
                        v_params = {
                            "part": "contentDetails,statistics,status",
                            "id": ",".join(v_ids),
                            "key": self.api_key
                        }
                        v_resp = await client.get(v_url, params=v_params)
                        if v_resp.status_code == 200:
                            v_data = v_resp.json()
                            for v_item in v_data.get("items", []):
                                vid_key = v_item.get("id")
                                raw_dur = v_item.get("contentDetails", {}).get("duration", "")
                                raw_views = v_item.get("statistics", {}).get("viewCount", "0")
                                is_embed = v_item.get("status", {}).get("embeddable", True)
                                details_map[vid_key] = {
                                    "duration": parse_iso8601_duration(raw_dur),
                                    "views": int(raw_views) if str(raw_views).isdigit() else 0,
                                    "is_embeddable": bool(is_embed)
                                }
                    except Exception as e:
                        logger.debug("Optional YouTube details lookup skipped: %s", e)

                results: List[UnifiedVideo] = []
                for item in items:
                    v_id = item.get("id", {}).get("videoId")
                    snippet = item.get("snippet", {})
                    if not v_id or not snippet:
                        continue

                    raw_title = snippet.get("title", "Untitled Video")
                    clean_title = html.unescape(raw_title)
                    raw_desc = snippet.get("description", "")
                    clean_desc = html.unescape(raw_desc)
                    creator = html.unescape(snippet.get("channelTitle", "Creator"))

                    thumbs = snippet.get("thumbnails", {})
                    thumb_url = (
                        thumbs.get("high", {}).get("url")
                        or thumbs.get("medium", {}).get("url")
                        or thumbs.get("default", {}).get("url")
                        or f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg"
                    )

                    pub_date = None
                    if snippet.get("publishedAt"):
                        try:
                            pub_date = datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00"))
                        except Exception:
                            pub_date = datetime.now(timezone.utc)

                    # Standard embed URL (autoplay=1, rel=0, modestbranding=1)
                    embed_url = f"https://www.youtube.com/embed/{v_id}?autoplay=1&rel=0&modestbranding=1"

                    meta = details_map.get(v_id, {})
                    duration = meta.get("duration", 0)
                    views_count = meta.get("views", 0)
                    is_embeddable = meta.get("is_embeddable", True)

                    results.append(
                        UnifiedVideo(
                            id=f"ext_{v_id}",
                            title=clean_title,
                            description=clean_desc,
                            video_path=embed_url,
                            thumbnail_path=thumb_url,
                            duration=duration,
                            views_count=views_count,
                            resolution="480p",
                            creator_name=creator,
                            creator_id=snippet.get("channelId"),
                            tags="",
                            source="youtube",
                            external_id=v_id,
                            playback_type="embed",
                            embed_url=embed_url,
                            license="Standard YouTube License",
                            published_at=pub_date,
                            created_at=pub_date or datetime.now(timezone.utc),
                            spaces=[],
                            is_embeddable=is_embeddable
                        )
                    )
                return results
        except httpx.TimeoutException:
            logger.warning("YouTube API search request timed out.")
            return []
        except httpx.RequestError as exc:
            logger.warning("YouTube API network request error: %s", exc)
            return []
        except Exception as exc:
            logger.warning("Unexpected error during external YouTube search: %s", exc)
            return []

    async def _search_invidious(self, filters: CatalogSearchFilters) -> List[UnifiedVideo]:
        """Search videos via public Invidious instances with automatic fallback."""
        q = filters.query.strip()
        sort_map = {
            "relevance": "relevance",
            "views": "view_count",
            "newest": "upload_date"
        }
        api_sort = sort_map.get(filters.sort_by, "relevance")

        for base_url in self.instances:
            try:
                url = f"{base_url}/api/v1/search"
                params = {
                    "q": q,
                    "type": "video",
                    "sort_by": api_sort
                }
                async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = []
                        for item in data:
                            if item.get("type") == "video":
                                unified = self._normalize_invidious_item(item)
                                if unified:
                                    results.append(unified)
                        return results[:filters.limit]
            except Exception as e:
                logger.debug("Invidious instance %s failed: %s", base_url, e)
                continue

        return []

    def _normalize_invidious_item(self, item: dict) -> Optional[UnifiedVideo]:
        video_id = item.get("videoId")
        if not video_id:
            return None

        thumb = ""
        thumbnails = item.get("videoThumbnails") or []
        if thumbnails:
            for t in thumbnails:
                if t.get("quality") in ("medium", "high", "sddefault"):
                    thumb = t.get("url")
                    break
            if not thumb and len(thumbnails) > 0:
                thumb = thumbnails[0].get("url")
        if not thumb:
            thumb = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

        duration = item.get("lengthSeconds") or 0
        if isinstance(duration, str) and duration.isdigit():
            duration = int(duration)

        pub_date = None
        pub_ts = item.get("published")
        if pub_ts:
            try:
                pub_date = datetime.fromtimestamp(pub_ts, tz=timezone.utc)
            except Exception:
                pub_date = datetime.now(timezone.utc)
        else:
            pub_date = datetime.now(timezone.utc)

        embed_url = f"https://www.youtube-nocookie.com/embed/{video_id}?autoplay=1&rel=0&modestbranding=1"

        return UnifiedVideo(
            id=f"ext_{video_id}",
            title=item.get("title") or "Untitled Video",
            description=item.get("description") or item.get("publishedText") or "",
            video_path=embed_url,
            thumbnail_path=thumb,
            duration=duration,
            views_count=item.get("viewCount") or 0,
            resolution="480p",
            creator_name=item.get("author") or "Creator",
            creator_id=item.get("authorId"),
            tags=",".join(item.get("keywords") or []),
            source="external",
            external_id=video_id,
            playback_type="embed",
            embed_url=embed_url,
            license="Standard YouTube License",
            published_at=pub_date,
            created_at=pub_date,
            spaces=[]
        )

    async def get_video(self, video_id: str) -> Optional[UnifiedVideo]:
        clean_id = video_id.replace("ext_", "")
        embed_url = f"https://www.youtube.com/embed/{clean_id}?autoplay=1&rel=0&modestbranding=1"

        if self.provider_type == "youtube" and self.api_key:
            try:
                url = "https://www.googleapis.com/youtube/v3/videos"
                params = {
                    "part": "snippet,contentDetails,statistics,status",
                    "id": clean_id,
                    "key": self.api_key
                }
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("items", [])
                        if items:
                            snippet = items[0].get("snippet", {})
                            content_details = items[0].get("contentDetails", {})
                            stats = items[0].get("statistics", {})
                            status_info = items[0].get("status", {})
                            thumbs = snippet.get("thumbnails", {})
                            thumb_url = (
                                thumbs.get("high", {}).get("url")
                                or thumbs.get("medium", {}).get("url")
                                or f"https://i.ytimg.com/vi/{clean_id}/hqdefault.jpg"
                            )
                            views = int(stats.get("viewCount", 0)) if str(stats.get("viewCount", "")).isdigit() else 0
                            duration = parse_iso8601_duration(content_details.get("duration", ""))
                            is_embed = status_info.get("embeddable", True)

                            return UnifiedVideo(
                                id=f"ext_{clean_id}",
                                title=html.unescape(snippet.get("title", "Video")),
                                description=html.unescape(snippet.get("description", "")),
                                video_path=embed_url,
                                thumbnail_path=thumb_url,
                                duration=duration,
                                views_count=views,
                                resolution="480p",
                                creator_name=html.unescape(snippet.get("channelTitle", "Creator")),
                                creator_id=snippet.get("channelId"),
                                tags="",
                                source="youtube",
                                external_id=clean_id,
                                playback_type="embed",
                                embed_url=embed_url,
                                license="Standard YouTube License",
                                published_at=datetime.now(timezone.utc),
                                created_at=datetime.now(timezone.utc),
                                spaces=[],
                                is_embeddable=bool(is_embed)
                            )
            except Exception as e:
                logger.warning("Error fetching YouTube video details: %s", e)

        # Fallback offline-safe representation
        return UnifiedVideo(
            id=f"ext_{clean_id}",
            title=f"Video ({clean_id})",
            description="External Catalog Stream",
            video_path=embed_url,
            thumbnail_path=f"https://i.ytimg.com/vi/{clean_id}/hqdefault.jpg",
            duration=300,
            views_count=10000,
            resolution="480p",
            creator_name="Creator",
            source="external",
            external_id=clean_id,
            playback_type="embed",
            embed_url=embed_url,
            license="Standard License",
            published_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            spaces=[]
        )

    async def get_related(self, video_id: str, limit: int = 10) -> List[UnifiedVideo]:
        return []

    async def get_creator_videos(self, creator_id_or_name: str, limit: int = 20) -> List[UnifiedVideo]:
        filters = CatalogSearchFilters(query=creator_id_or_name, limit=limit)
        return await self.search(filters)
