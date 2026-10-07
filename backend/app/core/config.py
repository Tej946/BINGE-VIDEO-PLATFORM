from pathlib import Path
from pydantic_settings import BaseSettings

# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "BINGE"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ROOT_DIR: Path = ROOT_DIR
    
    # Server configuration
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{ROOT_DIR / 'database' / 'binge.db'}"
    
    # Storage
    UPLOAD_DIR: Path = ROOT_DIR / "uploads"
    MAX_FILE_SIZE_MB: int = 500
    DEFAULT_QUALITY: str = "480p"
    
    # Privacy principles
    DEFAULT_TRACKING_ENABLED: bool = False
    DEFAULT_RECOMMENDATIONS_ENABLED: bool = False
    DEFAULT_LOCAL_HISTORY_ONLY: bool = True

    # Catalog & External Search Configuration
    EXTERNAL_CATALOG_ENABLED: bool = True
    YOUTUBE_API_KEY: str | None = None
    EXTERNAL_PROVIDER_TYPE: str = "youtube" # "youtube" | "invidious" | "none"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    class Config:
        env_file = (
            str(ROOT_DIR / ".env"),
            str(ROOT_DIR / "backend" / ".env"),
            ".env"
        )
        case_sensitive = True
        extra = "ignore"

settings = Settings()
