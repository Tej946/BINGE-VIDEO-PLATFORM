from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Safely migrate new columns into existing SQLite tables without data loss
        def migrate_sqlite_columns(connection):
            try:
                result = connection.exec_driver_sql("PRAGMA table_info(videos)")
                cols = [row[1] for row in result.fetchall()]
                if cols:
                    if "source" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN source VARCHAR(50) DEFAULT 'local'")
                    if "external_id" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN external_id VARCHAR(255)")
                    if "playback_type" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN playback_type VARCHAR(50) DEFAULT 'direct_stream'")
                    if "embed_url" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN embed_url VARCHAR(500)")
                    if "license" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN license VARCHAR(100) DEFAULT 'Standard'")
                    if "published_at" not in cols:
                        connection.exec_driver_sql("ALTER TABLE videos ADD COLUMN published_at TIMESTAMP")
            except Exception as e:
                print(f"Migration error: {e}")

        await conn.run_sync(migrate_sqlite_columns)
