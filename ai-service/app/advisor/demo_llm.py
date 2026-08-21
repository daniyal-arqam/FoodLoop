from __future__ import annotations

import json
import re
from typing import Any

from app.advisor.llm_client import ChatResult, ToolCallRequest

INSUFFICIENT_ANSWER = (
    "The available knowledge base does not provide sufficient information."
)

_CATEGORY_HINTS = (
    ("vegetarian", "Prepared"),
    ("prepared", "Prepared"),
    ("bakery", "Bakery"),
    ("bread", "Bakery"),
    ("produce", "Produce"),
    ("dairy", "Dairy"),
    ("meat", "Meat"),
    ("canned", "Canned"),
    ("frozen", "Frozen"),
)


class DemoLlmClient:
    """Deterministic planner used when OPENAI_API_KEY is unset.

    Advisor JSON is built from the surplus fields in the prompt.
    RAG answers are extractive from retrieved chunks.
    The matching agent still calls live FoodLoop tools; this client only chooses which tools.
    """

    async def complete(self, messages: list[dict[str, Any]], json_mode: bool = False, **kwargs) -> str:
        if json_mode:
            return _advice_json(messages)
        return _extractive_rag(messages)

    async def chat(
        self,
        messages: list[dict[str, Any]],
        json_mode: bool = False,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | dict[str, Any] | None = None,
        **kwargs,
    ) -> ChatResult:
        if tool_choice == "none" or not tools:
            content = await self.complete(messages, json_mode=json_mode)
            return ChatResult(
                content=content,
                tool_calls=[],
                assistant_message={"role": "assistant", "content": content},
            )

        tool_results = sum(1 for item in messages if item.get("role") == "tool")
        user_text = _first_user_text(messages)
        category, food_name = _infer_food_request(user_text)

        if tool_results == 0:
            arguments = {"category": category}
            if food_name:
                arguments["foodNameContains"] = food_name
            return _tool("find_available_food", arguments, "demo-food")
        if tool_results == 1:
            return _tool("find_organizations", {"category": category}, "demo-orgs")
        if tool_results == 2:
            listing_id = _first_listing_id(messages)
            organization_id = _first_organization_id(messages)
            if listing_id and organization_id:
                return _tool(
                    "calculate_match_score",
                    {"listingId": listing_id, "organizationId": organization_id},
                    "demo-score",
                )
            arguments = {"limit": 5}
            if listing_id:
                arguments["listingId"] = listing_id
            return _tool("generate_match_recommendation", arguments, "demo-rank")
        if tool_results == 3:
            listing_id = _first_listing_id(messages)
            arguments = {"limit": 5}
            if listing_id:
                arguments["listingId"] = listing_id
            return _tool("generate_match_recommendation", arguments, "demo-rank")

        content = "Matching complete from live FoodLoop tool results."
        return ChatResult(
            content=content,
            tool_calls=[],
            assistant_message={"role": "assistant", "content": content},
        )


def get_default_llm():
    from app.advisor.llm_client import OpenAiChatClient
    from app.core.config import settings

    if settings.openai_api_key:
        return OpenAiChatClient()
    return DemoLlmClient()


def _tool(name: str, arguments: dict[str, Any], call_id: str) -> ChatResult:
    arguments_json = json.dumps(arguments)
    return ChatResult(
        content=None,
        tool_calls=[
            ToolCallRequest(
                id=call_id,
                name=name,
                arguments=arguments,
                arguments_json=arguments_json,
            )
        ],
        assistant_message={
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": call_id,
                    "type": "function",
                    "function": {"name": name, "arguments": arguments_json},
                }
            ],
        },
    )


def _first_user_text(messages: list[dict[str, Any]]) -> str:
    for item in messages:
        if item.get("role") == "user" and isinstance(item.get("content"), str):
            return item["content"]
    return ""


def _infer_food_request(text: str) -> tuple[str, str | None]:
    lowered = text.lower()
    category = "Prepared"
    for needle, mapped in _CATEGORY_HINTS:
        if needle in lowered:
            category = mapped
            break
    food_name = "vegetarian" if "vegetarian" in lowered else None
    return category, food_name


def _first_listing_id(messages: list[dict[str, Any]]) -> str | None:
    for item in reversed(messages):
        if item.get("role") != "tool":
            continue
        try:
            payload = json.loads(item.get("content") or "{}")
        except json.JSONDecodeError:
            continue
        listings = payload.get("listings") or []
        if listings and listings[0].get("id"):
            return str(listings[0]["id"])
    return None


def _first_organization_id(messages: list[dict[str, Any]]) -> str | None:
    for item in reversed(messages):
        if item.get("role") != "tool":
            continue
        try:
            payload = json.loads(item.get("content") or "{}")
        except json.JSONDecodeError:
            continue
        organizations = payload.get("organizations") or []
        if organizations and organizations[0].get("id"):
            return str(organizations[0]["id"])
    return None


def _field(prompt: str, label: str, default: str = "") -> str:
    match = re.search(rf"- {re.escape(label)}:\s*(.+)", prompt, re.IGNORECASE)
    if not match:
        return default
    return match.group(1).strip()


def _advice_json(messages: list[dict[str, Any]]) -> str:
    prompt = messages[-1].get("content") or ""
    quantity = _field(prompt, "surplus quantity", "the reported surplus")
    category = _field(prompt, "food category", "surplus food")
    pattern = _field(prompt, "time pattern", "the listed window")
    frequency = _field(prompt, "frequency", "this pattern")
    provider = _field(prompt, "name", "The provider")
    advice = {
        "situation_summary": (
            f"{provider} reports {quantity} of {category} left {frequency} during {pattern}."
        ),
        "immediate_actions": [
            f"Publish tonight's {category} on FoodLoop as Available with the real quantity ({quantity}) and a short pickup window.",
            "Share allergen notes the kitchen already records before organizations claim.",
        ],
        "operational_improvements": [
            f"Use this {frequency} leftover pattern to trim production for {pattern}.",
            "Log each surplus listing so the matcher can score nearby verified organizations.",
        ],
        "redistribution_suggestions": [
            "Offer same-window pickup to verified FoodLoop organizations that need this category.",
            "Keep the listing Available until an organization claims it; do not hold food after expiry.",
        ],
        "long_term_recommendations": [
            f"Track {frequency} {category} surplus and set a recurring rescue partnership.",
        ],
        "caveats": [
            "These recommendations are generated from the surplus details you submitted, not from measured waste statistics.",
        ],
    }
    return json.dumps(advice)


def _extractive_rag(messages: list[dict[str, Any]]) -> str:
    prompt = messages[-1].get("content") or ""
    if "Retrieved context:" not in prompt:
        return INSUFFICIENT_ANSWER
    context = prompt.split("Retrieved context:", 1)[1].strip()
    if not context:
        return INSUFFICIENT_ANSWER
    lines = [
        line.strip()
        for line in context.splitlines()
        if line.strip() and not line.lower().startswith("source ")
    ]
    text = " ".join(lines).strip()
    if len(text) < 40:
        return INSUFFICIENT_ANSWER
    return text[:900]
