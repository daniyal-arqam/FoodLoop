import httpx
import pytest
from fastapi.testclient import TestClient

from app.advisor.llm_client import LlmClientError, OpenAiChatClient
from app.advisor.service import AdvisorService
from app.api.recommend import get_advisor_service
from app.main import create_app

EXAMPLE = {
    "surplusQuantity": 120,
    "foodCategory": "Prepared Meals",
    "timePattern": "7 PM - 9 PM",
    "frequency": "weekly",
}

FAKE_ADVICE = """{
  "situation_summary": "Harbour Kitchen reports 120 servings of prepared meals left weekly from 7 PM to 9 PM.",
  "immediate_actions": ["List the surplus on FoodLoop as soon as leftover volume is known."],
  "operational_improvements": ["Adjust evening production using this weekly leftover pattern."],
  "redistribution_suggestions": ["Share the listing with verified community organizations for same-evening pickup."],
  "long_term_recommendations": ["Log this weekly surplus and set a recurring rescue partnership."],
  "caveats": ["These are recommendations based on the reported pattern, not measured waste statistics."]
}"""


class FakeLlm:
    def __init__(self, content: str) -> None:
        self.content = content
        self.messages = None

    async def complete(self, messages, **kwargs):
        self.messages = messages
        return self.content


@pytest.fixture
def fake_llm():
    return FakeLlm(FAKE_ADVICE)


@pytest.fixture
def client(fake_llm):
    application = create_app()
    application.dependency_overrides[get_advisor_service] = lambda: AdvisorService(llm=fake_llm)
    with TestClient(application) as test_client:
        yield test_client


def test_recommend_complete_flow_returns_structured_advice(client, fake_llm):
    response = client.post(
        "/ai/recommend",
        json=EXAMPLE,
        headers={"x-user-id": "user-1", "x-user-role": "Provider"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    advice = body["data"]["advice"]
    assert "120 servings" in advice["situationSummary"]
    assert advice["immediateActions"]
    assert advice["operationalImprovements"]
    assert advice["redistributionSuggestions"]
    assert advice["longTermRecommendations"]
    assert advice["caveats"]
    assert body["data"]["input"]["foodCategory"] == "Prepared Meals"
    assert fake_llm.messages[0]["role"] == "system"
    assert "Do not invent statistics." in fake_llm.messages[0]["content"]
    assert "Prepared Meals" in fake_llm.messages[1]["content"]
    assert "Provider" in fake_llm.messages[1]["content"]


def test_recommend_alias_path(client):
    response = client.post("/recommend", json=EXAMPLE)
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_recommend_rejects_invalid_quantity(client):
    response = client.post("/ai/recommend", json={**EXAMPLE, "surplusQuantity": 0})
    assert response.status_code == 400
    assert response.json()["success"] is False


def test_recommend_surfaces_parse_errors(client, fake_llm):
    fake_llm.content = "not-json"
    response = client.post("/ai/recommend", json=EXAMPLE)
    assert response.status_code == 502
    assert "unreadable" in response.json()["message"].lower() or "not valid" in response.json()["message"].lower()


def test_missing_api_key_returns_503(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_API_KEY", raising=False)
    client = OpenAiChatClient()
    with pytest.raises(LlmClientError) as error:
        # complete is async; run via TestClient-independent pytest-asyncio alternative
        import asyncio

        asyncio.run(client.complete([{"role": "user", "content": "hi"}]))
    assert error.value.status_code == 503
    assert "OPENAI_API_KEY" in error.value.message


def test_llm_timeout_becomes_504(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-real")

    class TimeoutClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, *args, **kwargs):
            raise httpx.TimeoutException("slow")

    monkeypatch.setattr("app.advisor.llm_client.httpx.AsyncClient", TimeoutClient)
    client = OpenAiChatClient()
    import asyncio

    with pytest.raises(LlmClientError) as error:
        asyncio.run(client.complete([{"role": "user", "content": "hi"}]))
    assert error.value.status_code == 504
