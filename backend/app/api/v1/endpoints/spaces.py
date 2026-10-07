import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.space import Space, video_spaces
from app.models.video import Video
from app.schemas.space import (
    SpaceResponse,
    SpaceCreate,
    SpaceUpdate,
    AddVideoToSpacePayload,
    SyncVideoSpacesPayload
)
from app.schemas.video import VideoResponse

router = APIRouter()

DEFAULT_SPACES_SEED = [
    {"slug": "anime", "name": "Anime", "icon": "🎌", "color": "#FF4B72", "description": "Anime episodes, discussions, AMVs, and reviews."},
    {"slug": "horror", "name": "Horror", "icon": "👻", "color": "#9D4EDD", "description": "Creepypastas, short horror films, and mysteries."},
    {"slug": "movies", "name": "Movies & Cinema", "icon": "🎬", "color": "#FFB703", "description": "Film analyses, essays, and cinematic shorts."},
    {"slug": "gaming", "name": "Gaming", "icon": "🎮", "color": "#06D6A0", "description": "Speedruns, walkthroughs, and indie game reviews."},
    {"slug": "music", "name": "Music", "icon": "🎵", "color": "#118AB2", "description": "Original tracks, lo-fi beats, and live sessions."},
    {"slug": "education", "name": "Education", "icon": "📚", "color": "#00E5FF", "description": "Science, history, tutorials, and deep dives."},
    {"slug": "technology", "name": "Technology", "icon": "💻", "color": "#4361EE", "description": "Coding, engineering, AI ethics, and hardware."},
    {"slug": "japanese-learning", "name": "Japanese Learning", "icon": "🗾", "color": "#EF476F", "description": "Vocabulary, kanji, pronunciation, and immersion."}
]

def _generate_slug(name: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return cleaned or "space"

async def _find_space(slug_or_id: str, db: AsyncSession) -> Optional[Space]:
    if slug_or_id.isdigit():
        query = select(Space).options(selectinload(Space.videos)).where(Space.id == int(slug_or_id))
    else:
        query = select(Space).options(selectinload(Space.videos)).where(Space.slug == slug_or_id.strip().lower())
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def _get_or_create_video(payload: AddVideoToSpacePayload, db: AsyncSession) -> Video:
    vid_id_str = str(payload.video_id) if payload.video_id is not None else ""
    
    # 1. If pointing to existing video by DB integer ID:
    if vid_id_str.isdigit():
        res = await db.execute(select(Video).options(selectinload(Video.spaces)).where(Video.id == int(vid_id_str)))
        existing = res.scalar_one_or_none()
        if existing:
            return existing

    # 2. If pointing to external YouTube video:
    clean_ext_id = payload.external_id or (vid_id_str.replace("ext_", "") if vid_id_str.startswith("ext_") else None) or (vid_id_str if payload.source == "youtube" else None)
    if clean_ext_id:
        res = await db.execute(
            select(Video).options(selectinload(Video.spaces)).where(
                (Video.external_id == clean_ext_id) | (Video.source == "youtube") & (Video.external_id == clean_ext_id)
            )
        )
        existing_ext = res.scalar_one_or_none()
        if existing_ext:
            return existing_ext

    # 3. Create persistent Video record for external video in DB:
    embed_url = payload.embed_url or (f"https://www.youtube.com/embed/{clean_ext_id}?autoplay=1&rel=0&modestbranding=1" if clean_ext_id else (payload.video_path or ""))
    new_v = Video(
        title=payload.title or (f"Video ({clean_ext_id})" if clean_ext_id else "Untitled Video"),
        description=payload.description or "",
        video_path=payload.video_path or embed_url,
        thumbnail_path=payload.thumbnail_path or (f"https://i.ytimg.com/vi/{clean_ext_id}/hqdefault.jpg" if clean_ext_id else None),
        duration=payload.duration or 0,
        resolution=payload.resolution or "480p",
        creator_name=payload.creator_name or "Creator",
        source=payload.source or ("youtube" if clean_ext_id else "local"),
        external_id=clean_ext_id,
        playback_type="embed" if (clean_ext_id or payload.source == "youtube") else "direct_stream",
        embed_url=embed_url,
        license="Standard YouTube License" if (clean_ext_id or payload.source == "youtube") else "Standard",
        published_at=datetime.now(timezone.utc)
    )
    db.add(new_v)
    await db.commit()
    await db.refresh(new_v)
    
    reloaded = await db.execute(select(Video).options(selectinload(Video.spaces)).where(Video.id == new_v.id))
    return reloaded.scalar_one()

@router.get("", response_model=List[SpaceResponse])
async def list_spaces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Space).order_by(Space.id))
    spaces = result.scalars().all()

    # Seed default initial example spaces on first run if database is empty
    if not spaces:
        for seed in DEFAULT_SPACES_SEED:
            new_space = Space(
                slug=seed["slug"],
                name=seed["name"],
                icon=seed["icon"],
                color=seed["color"],
                description=seed["description"],
                is_default=False
            )
            db.add(new_space)
        await db.commit()
        refreshed = await db.execute(select(Space).order_by(Space.id))
        spaces = refreshed.scalars().all()

    # Build response with dynamic video counts
    response_list = []
    for sp in spaces:
        count_res = await db.execute(
            select(func.count(video_spaces.c.video_id)).where(video_spaces.c.space_id == sp.id)
        )
        count = count_res.scalar() or 0
        response_list.append(
            SpaceResponse(
                id=sp.id,
                slug=sp.slug,
                name=sp.name,
                icon=sp.icon,
                color=sp.color,
                description=sp.description,
                is_default=sp.is_default,
                created_at=sp.created_at,
                video_count=count
            )
        )
    return response_list

@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(payload: SpaceCreate, db: AsyncSession = Depends(get_db)):
    raw_slug = payload.slug.strip() if payload.slug else _generate_slug(payload.name)
    slug = _generate_slug(raw_slug)

    # Ensure unique slug
    counter = 1
    orig_slug = slug
    while True:
        existing = await db.execute(select(Space).where(Space.slug == slug))
        if not existing.scalar_one_or_none():
            break
        counter += 1
        slug = f"{orig_slug}-{counter}"

    new_space = Space(
        slug=slug,
        name=payload.name.strip(),
        icon=payload.icon.strip() if payload.icon else "📁",
        color=payload.color or "#00E5FF",
        description=payload.description.strip() if payload.description else "",
        is_default=False
    )
    db.add(new_space)
    await db.commit()
    await db.refresh(new_space)
    return SpaceResponse(
        id=new_space.id,
        slug=new_space.slug,
        name=new_space.name,
        icon=new_space.icon,
        color=new_space.color,
        description=new_space.description,
        is_default=new_space.is_default,
        created_at=new_space.created_at,
        video_count=0
    )

@router.get("/{slug_or_id}", response_model=SpaceResponse)
async def get_space(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")
    
    count_res = await db.execute(
        select(func.count(video_spaces.c.video_id)).where(video_spaces.c.space_id == space.id)
    )
    count = count_res.scalar() or 0
    return SpaceResponse(
        id=space.id,
        slug=space.slug,
        name=space.name,
        icon=space.icon,
        color=space.color,
        description=space.description,
        is_default=space.is_default,
        created_at=space.created_at,
        video_count=count
    )

@router.put("/{slug_or_id}", response_model=SpaceResponse)
async def update_space(slug_or_id: str, payload: SpaceUpdate, db: AsyncSession = Depends(get_db)):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")

    if payload.name is not None and payload.name.strip():
        space.name = payload.name.strip()
    if payload.icon is not None and payload.icon.strip():
        space.icon = payload.icon.strip()
    if payload.color is not None and payload.color.strip():
        space.color = payload.color.strip()
    if payload.description is not None:
        space.description = payload.description.strip()
    if payload.slug is not None and payload.slug.strip():
        new_slug = _generate_slug(payload.slug)
        if new_slug != space.slug:
            existing = await db.execute(select(Space).where(Space.slug == new_slug, Space.id != space.id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail=f"Slug '{new_slug}' is already in use")
            space.slug = new_slug

    await db.commit()
    await db.refresh(space)

    count_res = await db.execute(
        select(func.count(video_spaces.c.video_id)).where(video_spaces.c.space_id == space.id)
    )
    count = count_res.scalar() or 0
    return SpaceResponse(
        id=space.id,
        slug=space.slug,
        name=space.name,
        icon=space.icon,
        color=space.color,
        description=space.description,
        is_default=space.is_default,
        created_at=space.created_at,
        video_count=count
    )

@router.delete("/{slug_or_id}", status_code=status.HTTP_200_OK)
async def delete_space(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")

    space_id = space.id
    space_name = space.name

    # Clear video association relationship (videos themselves are preserved!)
    space.videos.clear()
    # Delete space record
    await db.delete(space)
    await db.commit()

    return {"message": f"Space '{space_name}' deleted successfully. All videos were preserved."}

@router.get("/{slug_or_id}/videos", response_model=List[VideoResponse])
async def get_space_videos(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")

    query = (
        select(Video)
        .join(video_spaces, Video.id == video_spaces.c.video_id)
        .options(selectinload(Video.spaces))
        .where(video_spaces.c.space_id == space.id)
        .order_by(Video.id.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{slug_or_id}/videos", response_model=VideoResponse)
async def add_video_to_space(
    slug_or_id: str,
    payload: AddVideoToSpacePayload,
    db: AsyncSession = Depends(get_db)
):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")

    video = await _get_or_create_video(payload, db)

    # Check if relationship already exists
    if not any(s.id == space.id for s in video.spaces):
        video.spaces.append(space)
        await db.commit()
        await db.refresh(video)

    # Reload with all associated spaces
    res = await db.execute(select(Video).options(selectinload(Video.spaces)).where(Video.id == video.id))
    return res.scalar_one()

@router.delete("/{slug_or_id}/videos/{video_id}", status_code=status.HTTP_200_OK)
async def remove_video_from_space(
    slug_or_id: str,
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    space = await _find_space(slug_or_id, db)
    if not space:
        raise HTTPException(status_code=404, detail=f"Space '{slug_or_id}' not found")

    # Find video by DB ID or external_id
    if video_id.isdigit():
        query = select(Video).options(selectinload(Video.spaces)).where(Video.id == int(video_id))
    else:
        clean_ext_id = video_id.replace("ext_", "")
        query = select(Video).options(selectinload(Video.spaces)).where(
            (Video.external_id == clean_ext_id) | (Video.source == "youtube" and Video.external_id == clean_ext_id)
        )
    result = await db.execute(query)
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found")

    # Remove the association only
    video.spaces = [s for s in video.spaces if s.id != space.id]
    await db.commit()

    return {"message": f"Video '{video.title}' removed from Space '{space.name}'."}

@router.post("/sync-video", response_model=VideoResponse)
async def sync_video_spaces(
    payload: SyncVideoSpacesPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Synchronize the spaces for a video (supports both local and external videos).
    Allows adding/removing a video from multiple spaces at once.
    """
    if not payload.video_data:
        raise HTTPException(status_code=400, detail="video_data must be provided")

    video = await _get_or_create_video(payload.video_data, db)

    # Fetch target spaces
    if payload.space_ids:
        spaces_res = await db.execute(select(Space).where(Space.id.in_(payload.space_ids)))
        target_spaces = spaces_res.scalars().all()
    else:
        target_spaces = []

    video.spaces = list(target_spaces)
    await db.commit()
    await db.refresh(video)

    res = await db.execute(select(Video).options(selectinload(Video.spaces)).where(Video.id == video.id))
    return res.scalar_one()
