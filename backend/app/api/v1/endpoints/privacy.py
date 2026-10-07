from fastapi import APIRouter
from app.schemas.privacy import PrivacySettings

router = APIRouter()

@router.get("/settings", response_model=PrivacySettings)
async def get_privacy_settings():
    return PrivacySettings(
        tracking_enabled=False,
        recommendations_enabled=False,
        local_history_only=True,
        analytics_collection=False
    )
