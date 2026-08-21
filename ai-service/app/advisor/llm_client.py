from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

from app.core.config import settings


class LlmClientError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class ToolCallRequest:
    id: str
    name: str
    arguments: dict[str, Any] = field(default_factory=dict)
    arguments_json: str = "{}"


@dataclass
class ChatResult:
    content: str | None
    tool_calls: list[ToolCallRequest]
    assistant_message: dict[str, Any]


class LlmClient(Protocol):
    async def complete(self, messages: list[dict[str, Any]], **kwargs) -> str: ...

    async def chat(self, messages: list[dict[str, Any]], **kwargs) -> ChatResult: ...


class OpenAiChatClient:
    async def complete(self, messages: list[dict[str, Any]], json_mode: bool = False, **kwargs) -> str:
        result = await self.chat(messages, json_mode=json_mode, **kwargs)
        if not result.content:
            raise LlmClientError("AI advisor returned an empty response", 502)
        return result.content

    async def chat(
        self,
        messages: list[dict[str, Any]],
        json_mode: bool = False,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | dict[str, Any] | None = None,
        **kwargs,
    ) -> ChatResult:
        api_key = settings.openai_api_key
        if not api_key:
            raise LlmClientError("AI advisor is not configured. Set OPENAI_API_KEY.", 503)

        url = f"{settings.openai_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": settings.openai_model,
            "temperature": 0.2,
            "messages": messages,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        if tools:
            body["tools"] = tools
            body["tool_choice"] = tool_choice or "auto"

        try:
            async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=body)
        except httpx.TimeoutException as error:
            raise LlmClientError("AI advisor timed out", 504) from error
        except httpx.HTTPError as error:
            raise LlmClientError("AI advisor is unavailable", 502) from error

        if response.status_code >= 400:
            raise LlmClientError("AI advisor is unavailable", 502)

        try:
            payload = response.json()
            message = payload["choices"][0]["message"]
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise LlmClientError("AI advisor returned an unreadable response", 502) from error

        content = message.get("content")
        if isinstance(content, str):
            content = content.strip() or None
        else:
            content = None

        tool_calls = [_parse_tool_call(item) for item in message.get("tool_calls") or []]
        assistant_message = {
            "role": "assistant",
            "content": message.get("content"),
        }
        if message.get("tool_calls"):
            assistant_message["tool_calls"] = message["tool_calls"]

        if not content and not tool_calls:
            raise LlmClientError("AI advisor returned an empty response", 502)

        return ChatResult(content=content, tool_calls=tool_calls, assistant_message=assistant_message)


def _parse_tool_call(item: dict[str, Any]) -> ToolCallRequest:
    function = item.get("function") or {}
    arguments_json = function.get("arguments") or "{}"
    try:
        parsed = json.loads(arguments_json) if arguments_json else {}
        if not isinstance(parsed, dict):
            parsed = {}
    except json.JSONDecodeError:
        parsed = {}
    return ToolCallRequest(
        id=str(item.get("id") or ""),
        name=str(function.get("name") or ""),
        arguments=parsed,
        arguments_json=arguments_json,
    )
