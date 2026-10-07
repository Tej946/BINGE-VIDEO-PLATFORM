from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

# Association table for Video <-> Space (Many-to-Many)
video_spaces = Table(
    "video_spaces",
    Base.metadata,
    Column("video_id", Integer, ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("space_id", Integer, ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True),
)

class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(20), default="📁")
    color = Column(String(30), default="#00E5FF")
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to videos
    videos = relationship("Video", secondary=video_spaces, back_populates="spaces")
