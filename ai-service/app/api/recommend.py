from fastapi import APIRouter, Depends, Request

from app.advisor.llm_client import LlmClientError
from app.advisor.parser import AdviceParseError
from app.advisor.service import AdvisorService
from app.models.advice import ProviderContext, RecommendRequest

router = APIRouter()


def get_advisor_service() -> AdvisorService:
    return AdvisorService()


@router.post("/ai/recommend")
@router.post("/recommend")
async def recommend(
    payload: RecommendRequest,
    request: Request,
    advisor: AdvisorService = Depends(get_advisor_service),
):
    context = ProviderContext(
        user_id=request.headers.get("x-user-id"),
        role=request.headers.get("x-user-role"),
        provider_name=payload.provider_name,
    )
    try:
        advice = await advisor.recommend(payload, context)
    except (LlmClientError, AdviceParseError):
        raise

    return {
        "success": True,
        "message": "Waste reduction advice generated",
        "data": advisor.public_payload(advice, payload),
    }
