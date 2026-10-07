from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.space import SpaceResponse

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None

class VideoCreate(VideoBase):
    space_ids: List[int] = []

class VideoResponse(VideoBase):
    id: int
    video_path: str
    thumbnail_path: Optional[str] = None
    duration: int = 0
    views_count: int = 0
    resolution: str = "480p"
    creator_name: str = "Anonymous"
    source: str = "local"
    external_id: Optional[str] = None
    playback_type: str = "direct_stream"
    embed_url: Optional[str] = None
    license: Optional[str] = "Standard"
    published_at: Optional[datetime] = None
    created_at: datetime
    spaces: List[SpaceResponse] = []

    model_config = ConfigDict(from_attributes=True)
