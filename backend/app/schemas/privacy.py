from pydantic import BaseModel

class PrivacySettings(BaseModel):
    tracking_enabled: bool = False
    recommendations_enabled: bool = False
    local_history_only: bool = True
    analytics_collection: bool = False
