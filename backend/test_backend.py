import asyncio
from app.core.database import init_db, AsyncSessionLocal, engine
from app.models.space import Space
from app.models.video import Video
from app.api.v1.endpoints.spaces import DEFAULT_SPACES_SEED
from app.api.v1.endpoints.videos import DEMO_VIDEOS_SEED
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test_init():
    print("Initializing Database tables...")
    await init_db()
    print("Database tables initialized successfully!")

    async with AsyncSessionLocal() as session:
        # Check spaces
        res = await session.execute(select(Space))
        spaces = res.scalars().all()
        if not spaces:
            print(f"Seeding {len(DEFAULT_SPACES_SEED)} default spaces...")
            for seed in DEFAULT_SPACES_SEED:
                sp = Space(
                    slug=seed["slug"],
                    name=seed["name"],
                    icon=seed["icon"],
                    color=seed["color"],
                    description=seed["description"],
                    is_default=True
                )
                session.add(sp)
            await session.commit()
            print("Spaces seeded!")

        # Check videos
        res_v = await session.execute(select(Video).options(selectinload(Video.spaces)))
        videos = res_v.scalars().all()
        if not videos:
            all_sp = await session.execute(select(Space))
            sp_map = {s.slug: s for s in all_sp.scalars().all()}
            print(f"Seeding {len(DEMO_VIDEOS_SEED)} demo videos...")
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
                    if s_slug in sp_map:
                        v.spaces.append(sp_map[s_slug])
                session.add(v)
            await session.commit()
            print("Demo videos seeded!")

        # Verify
        check_sp = await session.execute(select(Space))
        final_spaces = check_sp.scalars().all()
        check_v = await session.execute(select(Video).options(selectinload(Video.spaces)))
        final_videos = check_v.scalars().all()

        print(f"VERIFIED: {len(final_spaces)} Spaces, {len(final_videos)} Videos in SQLite database!")
        for sp in final_spaces:
            print(f"  - {sp.name} (slug: {sp.slug})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_init())
