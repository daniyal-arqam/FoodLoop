import json

from fastapi.testclient import TestClient

from app.advisor.llm_client import ChatResult, ToolCallRequest
from app.agent.foodloop_client import FoodLoopClient
from app.agent.service import MatchingAgent
from app.api.agent import get_matching_agent
from app.main import create_app
from tests.agent_fakes import KARACHI_FOOD_BANK, VEGETARIAN_LISTING, FakeFoodLoop


class ScriptedLlm:
    def __init__(self, script: list[ChatResult]) -> None:
        self.script = list(script)
        self.calls = []

    async def chat(self, messages, **kwargs):
        self.calls.append({"messages": messages, "kwargs": kwargs})
        if not self.script:
            return ChatResult(
                content="No further tools.",
                tool_calls=[],
                assistant_message={"role": "assistant", "content": "No further tools."},
            )
        return self.script.pop(0)


def _tool_turn(name: str, arguments: dict, call_id: str) -> ChatResult:
    return ChatResult(
        content=None,
        tool_calls=[
            ToolCallRequest(
                id=call_id,
                name=name,
                arguments=arguments,
                arguments_json=json.dumps(arguments),
            )
        ],
        assistant_message={
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": call_id,
                    "type": "function",
                    "function": {"name": name, "arguments": json.dumps(arguments)},
                }
            ],
        },
    )


def _final(content: str) -> ChatResult:
    return ChatResult(
        content=content,
        tool_calls=[],
        assistant_message={"role": "assistant", "content": content},
    )


VEGETARIAN_SCRIPT = [
    _tool_turn("find_available_food", {"category": "Prepared", "foodNameContains": "vegetarian"}, "call-food"),
    _tool_turn("find_organizations", {"category": "Prepared"}, "call-orgs"),
    _tool_turn(
        "calculate_match_score",
        {"listingId": "listing-veg-1", "organizationId": "org-kitchen-1"},
        "call-score",
    ),
    _tool_turn("generate_match_recommendation", {"listingId": "listing-veg-1", "limit": 5}, "call-rank"),
    _final(
        "Recommended organization: Karachi Food Bank (score 0.8125). "
        "Category matches Prepared vegetarian meals. Urgency is high because expiry is soon. "
        "Quantity fit is 0.75. Distance is 0.012 km."
    ),
]


def _client(script=None, backend=None, require_auth=True):
    backend = backend or FakeFoodLoop(require_auth=require_auth)
    foodloop = FoodLoopClient(
        authorization="Bearer test-token" if require_auth else None,
        transport=backend.transport(),
        food_service_url="http://localhost:4002",
        organization_service_url="http://localhost:4003",
        matcher_url="http://localhost:8001",
    )
    llm = ScriptedLlm(script or VEGETARIAN_SCRIPT)
    application = create_app()
    application.dependency_overrides[get_matching_agent] = lambda: MatchingAgent(llm=llm, client=foodloop)
    return TestClient(application), llm, backend, foodloop


def test_agent_runs_real_tool_workflow_for_vegetarian_meals():
    client, llm, backend, _foodloop = _client()
    response = client.post(
        "/ai/agent",
        json={"message": "Find organizations that could use vegetarian meals"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200
    body = response.json()
    data = body["data"]
    assert body["success"] is True
    assert "Karachi Food Bank" in data["answer"]
    names = [item["name"] for item in data["toolCalls"]]
    assert names == [
        "find_available_food",
        "find_organizations",
        "calculate_match_score",
        "generate_match_recommendation",
    ]
    assert all(item["ok"] for item in data["toolCalls"])
    assert data["toolCalls"][0]["listingIds"] == ["listing-veg-1"]
    recs = data["recommendations"]
    assert recs
    top = recs[0]
    assert top["organizationId"] == KARACHI_FOOD_BANK["id"]
    assert top["organizationName"] == "Karachi Food Bank"
    assert top["listingId"] == VEGETARIAN_LISTING["id"]
    assert top["listingName"] == "Vegetarian meal"
    assert top["listingQuantity"] == 30
    assert top["listingLocation"] == "12 Rescue Street, Karachi"
    assert top["score"] == 0.8125
    assert top["distanceKm"] == 0.012
    assert top["urgency"] == 0.9167
    assert top["quantityFit"] == 0.75
    assert "Category matches" in top["why"]
    food_paths = [call["path"] for call in backend.calls if call["path"].startswith("/foods")]
    assert "/foods" in food_paths
    matcher_paths = [call["path"] for call in backend.calls if call["path"] in {"/score", "/find"}]
    assert "/score" in matcher_paths
    assert "/find" in matcher_paths
    assert llm.calls[0]["kwargs"]["tools"]


def test_agent_alias_and_does_not_invent_organizations():
    hallucinated = list(VEGETARIAN_SCRIPT[:-1]) + [
        _final("Recommended organization: Invented Kitchen, a fake charity that does not exist.")
    ]
    client, _llm, _backend, _foodloop = _client(script=hallucinated)
    response = client.post("/agent", json={"message": "Find organizations that could use vegetarian meals"})
    assert response.status_code == 200
    data = response.json()["data"]
    org_ids = {item["organizationId"] for item in data["recommendations"]}
    org_names = {item["organizationName"] for item in data["recommendations"]}
    assert "Invented Kitchen" not in org_names
    assert "Invented Kitchen" not in data["answer"]
    assert org_ids == {"org-kitchen-1"}
    assert "Karachi Food Bank" in data["answer"]


def test_agent_rejects_invented_listing_id():
    script = [
        _tool_turn("find_available_food", {"category": "Prepared"}, "call-food"),
        _tool_turn("find_organizations", {"category": "Prepared"}, "call-orgs"),
        _tool_turn(
            "calculate_match_score",
            {"listingId": "invented-listing", "organizationId": "org-kitchen-1"},
            "call-score",
        ),
        _final("There was no invented listing in FoodLoop."),
    ]
    client, _llm, _backend, _foodloop = _client(script=script)
    response = client.post("/ai/agent", json={"message": "Match a listing that does not exist here."})
    assert response.status_code == 200
    data = response.json()["data"]
    score_call = next(item for item in data["toolCalls"] if item["name"] == "calculate_match_score")
    assert score_call["ok"] is False
    assert "not found" in score_call["error"].lower()
    assert data["recommendations"] == []


def test_agent_returns_empty_when_no_listings():
    backend = FakeFoodLoop(listings=[], organizations=[KARACHI_FOOD_BANK], require_auth=False)
    script = [
        _tool_turn("find_available_food", {"category": "Prepared", "foodNameContains": "vegetarian"}, "call-food"),
        _tool_turn("find_organizations", {"category": "Prepared"}, "call-orgs"),
        _tool_turn("generate_match_recommendation", {}, "call-rank"),
        _final("FoodLoop has no matching vegetarian listings."),
    ]
    client, _llm, _backend, _foodloop = _client(script=script, backend=backend, require_auth=False)
    response = client.post("/ai/agent", json={"message": "Find organizations that could use vegetarian meals"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["recommendations"] == []
    assert data["toolCalls"][0]["listingIds"] == []
    assert "no matching" in data["answer"].lower()


def test_agent_rejects_short_message():
    client, *_rest = _client()
    response = client.post("/ai/agent", json={"message": "hi"})
    assert response.status_code == 400
    assert response.json()["success"] is False
