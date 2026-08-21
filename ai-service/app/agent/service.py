from __future__ import annotations

import logging
from typing import Any

from app.advisor.llm_client import ChatResult, LlmClient, ToolCallRequest
from app.agent.executor import ToolExecutor, dumps
from app.agent.foodloop_client import FoodLoopClient
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import TOOL_DEFINITIONS
from app.core.config import settings

logger = logging.getLogger("foodloop.matching_agent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logger.addHandler(_handler)

NO_MATCH_ANSWER = (
    "No eligible organization match was found in FoodLoop for the available listings."
)


class MatchingAgent:
    def __init__(self, llm: LlmClient | None = None, client: FoodLoopClient | None = None) -> None:
        from app.advisor.demo_llm import get_default_llm

        self.llm = llm or get_default_llm()
        self.client = client

    async def run(self, message: str, authorization: str | None = None) -> dict[str, Any]:
        client = self.client or FoodLoopClient(authorization=authorization)
        owns_client = self.client is None
        executor = ToolExecutor(client)
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message.strip()},
        ]

        try:
            answer = await self._loop(messages, executor)
        finally:
            if owns_client:
                await client.aclose()

        recommendations = _grounded_recommendations(executor)
        if recommendations:
            answer = _answer_from_recommendations(recommendations)
        elif not answer:
            answer = NO_MATCH_ANSWER

        return {
            "answer": answer,
            "toolCalls": executor.tool_calls,
            "recommendations": recommendations,
        }

    async def _loop(self, messages: list[dict[str, Any]], executor: ToolExecutor) -> str:
        max_steps = max(1, settings.agent_max_steps)
        for step in range(max_steps):
            tool_choice = _tool_choice(step, max_steps, executor)
            result = await self._chat(messages, tool_choice)
            if not result.tool_calls:
                return (result.content or "").strip()

            messages.append(result.assistant_message)
            for call in result.tool_calls:
                payload = await _run_call(executor, call)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.id or call.name,
                        "content": dumps(payload),
                    }
                )
        logger.warning("agent_max_steps_reached steps=%s", max_steps)
        return ""

    async def _chat(self, messages: list[dict[str, Any]], tool_choice: str) -> ChatResult:
        chat = getattr(self.llm, "chat", None)
        if chat is None:
            content = await self.llm.complete(messages)
            return ChatResult(
                content=content,
                tool_calls=[],
                assistant_message={"role": "assistant", "content": content},
            )
        return await chat(messages, tools=TOOL_DEFINITIONS, tool_choice=tool_choice)


async def _run_call(executor: ToolExecutor, call: ToolCallRequest) -> dict[str, Any]:
    if not call.name:
        result = {"error": "Tool call was missing a function name", "status": 400}
        executor.tool_calls.append(
            {"id": call.id, "name": "", "arguments": call.arguments, "ok": False, "durationMs": 0, "error": result["error"]}
        )
        return result
    return await executor.execute(call.name, call.arguments, call_id=call.id)


def _tool_choice(step: int, max_steps: int, executor: ToolExecutor) -> str:
    if step >= max_steps - 1:
        return "none"
    if executor.recommendations or (
        executor.tool_calls
        and executor.tool_calls[-1]["name"] == "generate_match_recommendation"
    ):
        return "auto"
    return "required"


def _grounded_recommendations(executor: ToolExecutor) -> list[dict[str, Any]]:
    if executor.recommendations:
        return executor.recommendations
    eligible = [item for item in executor.score_results if item.get("eligible")]
    eligible.sort(key=lambda item: item.get("score") or 0, reverse=True)
    return eligible


def _answer_from_recommendations(recommendations: list[dict[str, Any]]) -> str:
    top = recommendations[0]
    return (
        f"Recommended organization: {top.get('organizationName')} "
        f"(score {top.get('score')}). {top.get('why')} "
        f"Urgency score {top.get('urgency')}. Quantity fit {top.get('quantityFit')}. "
        f"Distance {top.get('distanceKm')} km."
    )
