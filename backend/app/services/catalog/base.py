from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass, field
from app.schemas.catalog import UnifiedVideo

@dataclass
class CatalogSearchFilters:
    query: Optional[str] = None
    spaces: List[str] = field(default_factory=list)
    sort_by: str = "relevance" # 'relevance' | 'newest' | 'views' | 'duration'
    limit: int = 24
    offset: int = 0
    source: Optional[str] = None # None (all), 'local', 'external'

class BaseVideoProvider(ABC):
    """
    Abstract interface for video catalog sources.
    Enables BINGE to aggregate videos across local database and external sources.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier for this provider (e.g. 'local', 'invidious', 'peertube', 'youtube')"""
        pass

    @abstractmethod
    async def search(self, filters: CatalogSearchFilters) -> List[UnifiedVideo]:
        """Search videos matching query and filters"""
        pass

    @abstractmethod
    async def get_video(self, video_id: str) -> Optional[UnifiedVideo]:
        """Retrieve video details by ID or external identifier"""
        pass

    @abstractmethod
    async def get_related(self, video_id: str, limit: int = 10) -> List[UnifiedVideo]:
        """Retrieve related videos based on content/creator/tags (strictly non-algorithmic)"""
        pass

    @abstractmethod
    async def get_creator_videos(self, creator_id_or_name: str, limit: int = 20) -> List[UnifiedVideo]:
        """Retrieve videos published by a creator/channel"""
        pass
