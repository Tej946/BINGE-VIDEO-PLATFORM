from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict

class SpaceBase(BaseModel):
    slug: str
    name: str
    icon: str = "📁"
    color: str = "#00E5FF"
    description: Optional[str] = None

class SpaceCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    icon: str = "📁"
    color: str = "#00E5FF"
    description: Optional[str] = None

class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class SpaceResponse(SpaceBase):
    id: int
    is_default: bool
    created_at: datetime
    video_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class AddVideoToSpacePayload(BaseModel):
    video_id: Optional[Union[int, str]] = None
    title: Optional[str] = None
    description: Optional[str] = None
    video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    duration: int = 0
    resolution: str = "480p"
    creator_name: str = "Anonymous"
    source: str = "local"
    external_id: Optional[str] = None
    embed_url: Optional[str] = None

class SyncVideoSpacesPayload(BaseModel):
    space_ids: List[int] = []
    video_data: Optional[AddVideoToSpacePayload] = None
