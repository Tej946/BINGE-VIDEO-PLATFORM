import os
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.models.video import Video
from app.models.space import Space
from app.schemas.video import VideoResponse

router = APIRouter()

VIDEOS_DIR = settings.UPLOAD_DIR / "videos"
THUMBNAILS_DIR = settings.UPLOAD_DIR / "thumbnails"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

DEMO_VIDEOS_SEED = [
    {
        "title": "One Piece: The Philosophy of Freedom & Will of D",
        "description": "An in-depth analysis of Eiichiro Oda's worldbuilding, narrative arcs, and character motivations in the Grand Line.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60",
        "duration": 842,
        "resolution": "480p",
        "creator_name": "LuffyScholar",
        "tags": "anime,onepiece,lore,analysis",
        "space_slugs": ["anime"]
    },
    {
        "title": "The Evolution of Psychological Horror in Cinema",
        "description": "Exploring how dread is crafted without relying on cheap jump scares — from The Shining to The Witch.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=60",
        "duration": 1150,
        "resolution": "480p",
        "creator_name": "MidnightCinema",
        "tags": "horror,cinema,film-essay,psychological",
        "space_slugs": ["horror", "movies"]
    },
    {
        "title": "Speedrunning Fundamentals: Pixel Perfect Precision",
        "description": "How modern speedrunners manipulate game physics, frame windows, and RNG to break records.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=60",
        "duration": 620,
        "resolution": "480p",
        "creator_name": "GlitchHunter",
        "tags": "gaming,speedrun,retro,mechanics",
        "space_slugs": ["gaming"]
    },
    {
        "title": "Mastering Japanese Particles: は (Wa) vs が (Ga)",
        "description": "A clear, intuitive guide to understanding topicalization and grammatical subjects with practical examples.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop&q=60",
        "duration": 480,
        "resolution": "480p",
        "creator_name": "NihongoLab",
        "tags": "japanese,grammar,particles,nihongo",
        "space_slugs": ["japanese-learning", "education"]
    },
    {
        "title": "Cinematography Masterclass: Composition & Color Theory",
        "description": "Deconstructing color palettes, rule of thirds, leading lines, and anamorphic lenses in modern masterpieces.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=60",
        "duration": 1340,
        "resolution": "480p",
        "creator_name": "DirectorEye",
        "tags": "movies,cinematography,directing,visuals",
        "space_slugs": ["movies", "education"]
    },
    {
        "title": "Building a Fast, Privacy-First Architecture with SQLite & Python",
        "description": "Why local-first, minimal telemetry software architectures are the future of user privacy and web performance.",
        "video_path": "uploads/videos/demo_sample.mp4",
        "thumbnail_path": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
        "duration": 910,
        "resolution": "480p",
        "creator_name": "ByteCraft",
        "tags": "technology,privacy,python,sqlite,fastapi",
        "space_slugs": ["technology", "education"]
    }
]

@router.get("", response_model=List[VideoResponse])
async def list_videos(
    spaces: Optional[str] = Query(None, description="Comma-separated space slugs for merged view"),
    search: Optional[str] = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Video).options(selectinload(Video.spaces)).order_by(Video.id.desc())
    result = await db.execute(query)
    videos = result.scalars().all()

    # Seed if database is empty
    if not videos:
        all_spaces_res = await db.execute(select(Space))
        space_map = {sp.slug: sp for sp in all_spaces_res.scalars().all()}

        for seed in DEMO_VIDEOS_SEED:
            v = Video(
                title=seed["title"],
                description=seed["description"],
                video_path=seed["video_path"],
                thumbnail_path=seed["thumbnail_path"],
                duration=seed["duration"],
                resolution=seed["resolution"],
                creator_name=seed["creator_name"],
                tags=seed["tags"]
            )
            for s_slug in seed["space_slugs"]:
                if s_slug in space_map:
                    v.spaces.append(space_map[s_slug])
            db.add(v)
        await db.commit()
        refreshed = await db.execute(select(Video).options(selectinload(Video.spaces)).order_by(Video.id.desc()))
        videos = refreshed.scalars().all()

    # Filter by Spaces (Merged View)
    if spaces:
        filter_slugs = set(s.strip().lower() for s in spaces.split(",") if s.strip())
        if filter_slugs:
            filtered = []
            for v in videos:
                v_slugs = {sp.slug for sp in v.spaces}
                if filter_slugs.intersection(v_slugs):
                    filtered.append(v)
            videos = filtered
    # Filter by search keyword
    if search:
        q = search.strip().lower()
        videos = [
            v for v in videos
            if q in v.title.lower() or (v.description and q in v.description.lower()) or (v.tags and q in v.tags.lower())
        ]

    return videos

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Video).options(selectinload(Video.spaces)).where(Video.id == video_id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Increment views
    video.views_count = (video.views_count or 0) + 1
    await db.commit()
    return video

@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    space_ids: Optional[str] = Form(None), # Comma-separated space IDs e.g. "1,2"
    tags: Optional[str] = Form(None),
    creator_name: Optional[str] = Form("Creator"),
    video_file: UploadFile = File(...),
    thumbnail_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # Validate video format
    allowed_extensions = {".mp4", ".mkv", ".webm", ".mov", ".avi"}
    file_ext = Path(video_file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported video format: {file_ext}")

    # Generate safe unique filename
    timestamp = int(datetime.now(timezone.utc).timestamp())
    safe_video_name = f"video_{timestamp}_{video_file.filename.replace(' ', '_')}"
    video_target_path = VIDEOS_DIR / safe_video_name

    with open(video_target_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)

    # Relative path stored in DB
    relative_video_path = f"uploads/videos/{safe_video_name}"

    # Handle Thumbnail
    relative_thumb_path = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"
    if thumbnail_file and thumbnail_file.filename:
        safe_thumb_name = f"thumb_{timestamp}_{thumbnail_file.filename.replace(' ', '_')}"
        thumb_target_path = THUMBNAILS_DIR / safe_thumb_name
        with open(thumb_target_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail_file.file, buffer)
        relative_thumb_path = f"uploads/thumbnails/{safe_thumb_name}"

    # Create Video record (default quality: 480p)
    new_video = Video(
        title=title.strip(),
        description=description.strip() if description else None,
        video_path=relative_video_path,
        thumbnail_path=relative_thumb_path,
        duration=300, # default 5m estimate if probe not present
        resolution="480p",
        creator_name=creator_name.strip() or "Creator",
        tags=tags.strip() if tags else None
    )

    # Attach Spaces
    if space_ids:
        try:
            ids = [int(i.strip()) for i in space_ids.split(",") if i.strip()]
            spaces_res = await db.execute(select(Space).where(Space.id.in_(ids)))
            new_video.spaces = list(spaces_res.scalars().all())
        except ValueError:
            pass

    db.add(new_video)
    await db.commit()
    await db.refresh(new_video)

    # Re-fetch with loaded spaces
    result = await db.execute(
        select(Video).options(selectinload(Video.spaces)).where(Video.id == new_video.id)
    )
    return result.scalar_one()

# HTTP 206 Partial Content Range Streaming
@router.get("/{video_id}/stream")
async def stream_video(video_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = Path(settings.ROOT_DIR) / video.video_path
    if not file_path.exists():
        # Fallback to demo sample if video path was mock
        demo_fallback = VIDEOS_DIR / "demo_sample.mp4"
        if demo_fallback.exists():
            file_path = demo_fallback
        else:
            raise HTTPException(status_code=404, detail="Video file not found on disk")

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")

    if not range_header:
        # Full content stream
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        return StreamingResponse(
            iterfile(),
            media_type="video/mp4",
            headers={"Content-Length": str(file_size), "Accept-Ranges": "bytes"}
        )

    # Range parsing e.g. "bytes=0-1048576"
    byte_range = range_header.replace("bytes=", "").split("-")
    start = int(byte_range[0]) if byte_range[0] else 0
    end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_size - 1

    if start >= file_size:
        raise HTTPException(status_code=416, detail="Requested range not satisfiable")

    # Limit chunk size to 1MB for smooth, low-latency 480p delivery
    chunk_size = 1024 * 1024 # 1 MB
    if end - start + 1 > chunk_size:
        end = start + chunk_size - 1

    content_length = end - start + 1

    def send_bytes():
        with open(file_path, "rb") as f:
            f.seek(start)
            bytes_left = content_length
            while bytes_left > 0:
                read_size = min(64 * 1024, bytes_left)
                data = f.read(read_size)
                if not data:
                    break
                bytes_left -= len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(send_bytes(), status_code=206, headers=headers)
