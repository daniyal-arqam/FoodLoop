from app.advisor.llm_client import LlmClient
from app.advisor.parser import parse_advice
from app.advisor.prompts import build_messages
from app.core.config import settings
from app.models.advice import Advice, ProviderContext, RecommendRequest


class AdvisorService:
    def __init__(self, llm: LlmClient | None = None) -> None:
        from app.advisor.demo_llm import get_default_llm

        self.llm = llm or get_default_llm()

    async def recommend(self, payload: RecommendRequest, context: ProviderContext) -> Advice:
        messages = build_messages(payload, context)
        raw = await self.llm.complete(messages, json_mode=True)
        return parse_advice(raw)

    def public_payload(self, advice: Advice, payload: RecommendRequest) -> dict:
        return {
            "advice": advice.model_dump(by_alias=True),
            "input": {
                "surplusQuantity": payload.surplus_quantity,
                "foodCategory": payload.food_category,
                "timePattern": payload.time_pattern,
                "frequency": payload.frequency,
                "unit": payload.unit,
            },
            "model": settings.openai_model if settings.openai_api_key else "foodloop-structured",
        }
