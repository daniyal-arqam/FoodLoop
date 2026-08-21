from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from rag.service import RagService

router = APIRouter()


class RagQueryRequest(BaseModel):
    question: Annotated[str, Field(min_length=5)]


def get_rag_service() -> RagService:
    from app.core.config import settings

    return RagService.from_index(settings.rag_index_dir)


@router.post("/ai/rag/query")
@router.post("/rag/query")
async def rag_query(payload: RagQueryRequest, rag: RagService = Depends(get_rag_service)):
    result = await rag.query(payload.question.strip())
    return {
        "success": True,
        "message": "Grounded answer generated" if result["grounded"] else "Insufficient knowledge base coverage",
        "data": {
            "answer": result["answer"],
            "sources": result["sources"],
        },
    }
