from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def get_health():
    index_file = Path(settings.rag_index_dir) / "index.faiss"
    return {
        "success": True,
        "message": "Service is healthy",
        "data": {
            "service": settings.service_name,
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ragIndexReady": index_file.is_file(),
        },
    }
