from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.space import SpaceResponse

class UnifiedVideo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration: int = 0
    views_count: int = 0
    resolution: str = "480p"
    creator_name: str = "Creator"
    creator_id: Optional[str] = None
    tags: Optional[str] = None
    source: str = "local" # 'local' | 'youtube' | 'peertube' | 'archive_org' | 'external'
    external_id: Optional[str] = None
    playback_type: str = "direct_stream" # 'direct_stream' | 'embed' | 'hls'
    embed_url: Optional[str] = None
    license: Optional[str] = "Standard"
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    spaces: List[SpaceResponse] = []
    is_embeddable: bool = True

    model_config = ConfigDict(from_attributes=True)

class CatalogSearchResult(BaseModel):
    items: List[UnifiedVideo]
    total: int
    query: Optional[str] = None
    sources_searched: List[str] = []
    spaces_filtered: List[str] = []
    sort_by: str = "relevance"
    catalog_status: str = "active"
