from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def get_health():
    return {
        "success": True,
        "message": "Service is healthy",
        "data": {
            "service": settings.service_name,
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
