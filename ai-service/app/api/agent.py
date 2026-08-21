from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.agent.service import MatchingAgent

router = APIRouter()


class AgentRequest(BaseModel):
    message: Annotated[str, Field(min_length=5, max_length=2000)]


def get_matching_agent() -> MatchingAgent:
    return MatchingAgent()


@router.post("/ai/agent")
@router.post("/agent")
async def run_agent(
    payload: AgentRequest,
    request: Request,
    agent: MatchingAgent = Depends(get_matching_agent),
):
    result = await agent.run(
        payload.message.strip(),
        authorization=request.headers.get("authorization"),
    )
    return {
        "success": True,
        "message": "Matching agent completed",
        "data": {
            "answer": result["answer"],
            "toolCalls": result["toolCalls"],
            "recommendations": result["recommendations"],
        },
    }
