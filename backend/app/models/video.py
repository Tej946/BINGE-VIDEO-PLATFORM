from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.space import video_spaces

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    video_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    duration = Column(Integer, default=0) # Duration in seconds
    views_count = Column(Integer, default=0)
    resolution = Column(String(20), default="480p")
    creator_name = Column(String(100), default="Anonymous")
    tags = Column(String(255), nullable=True) # comma-separated tags
    
    # Catalog / Multi-Source Architecture Fields
    source = Column(String(50), default="local", index=True) # 'local' | 'youtube' | 'peertube' | 'archive_org' | 'external'
    external_id = Column(String(255), nullable=True, index=True) # ID on external catalog/provider
    playback_type = Column(String(50), default="direct_stream") # 'direct_stream' | 'embed' | 'hls'
    embed_url = Column(String(500), nullable=True) # Privacy-enhanced embed URL if external
    license = Column(String(100), default="Standard")
    published_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Many-to-Many spaces
    spaces = relationship("Space", secondary=video_spaces, back_populates="videos")
