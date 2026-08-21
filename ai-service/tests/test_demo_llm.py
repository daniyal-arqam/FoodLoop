import asyncio

from app.advisor.demo_llm import DemoLlmClient
from app.advisor.service import AdvisorService
from app.agent.foodloop_client import FoodLoopClient
from app.agent.service import MatchingAgent
from app.models.advice import ProviderContext, RecommendRequest
from rag.service import INSUFFICIENT_ANSWER, RagService, ingest_knowledge_base
from tests.agent_fakes import KARACHI_FOOD_BANK, FakeFoodLoop


def test_demo_advisor_uses_submitted_surplus_fields():
    service = AdvisorService(llm=DemoLlmClient())
    advice = asyncio.run(
        service.recommend(
            RecommendRequest(
                surplusQuantity=120,
                foodCategory="Prepared Meals",
                timePattern="7 PM - 9 PM",
                frequency="weekly",
                unit="servings",
                providerName="Ayesha Khan",
            ),
            ProviderContext(provider_name="Ayesha Khan", role="Provider"),
        )
    )
    assert "120" in advice.situation_summary
    assert "Prepared Meals" in advice.situation_summary
    assert advice.immediate_actions
    assert advice.caveats


def test_demo_rag_answers_from_retrieved_chunks(tmp_path):
    knowledge = tmp_path / "kb"
    knowledge.mkdir()
    (knowledge / "prepared-food-redistribution.md").write_text(
        "---\ntitle: Redistributing prepared food\ntopic: redistribution\n---\n\n"
        "Before redistributing prepared food, confirm holding conditions and a short pickup window.\n",
        encoding="utf-8",
    )
    output = tmp_path / "index"
    ingest_knowledge_base(knowledge, output)
    service = RagService.from_index(output, llm=DemoLlmClient())
    result = asyncio.run(service.query("What should we consider before redistributing prepared food?"))
    assert result["grounded"] is True
    assert "holding conditions" in result["answer"].lower()
    assert result["sources"]
    assert result["answer"] != INSUFFICIENT_ANSWER


def test_demo_matching_agent_calls_live_foodloop_tools():
    backend = FakeFoodLoop(require_auth=False)
    client = FoodLoopClient(
        authorization=None,
        transport=backend.transport(),
        food_service_url="http://localhost:4002",
        organization_service_url="http://localhost:4003",
        matcher_url="http://localhost:8001",
    )
    agent = MatchingAgent(llm=DemoLlmClient(), client=client)
    result = asyncio.run(agent.run("Find organizations that could use vegetarian meals"))
    names = [item["name"] for item in result["toolCalls"]]
    assert names == [
        "find_available_food",
        "find_organizations",
        "calculate_match_score",
        "generate_match_recommendation",
    ]
    assert all(item["ok"] for item in result["toolCalls"])
    assert result["recommendations"]
    assert result["recommendations"][0]["organizationName"] == KARACHI_FOOD_BANK["organizationName"]
    assert "Karachi Food Bank" in result["answer"]
    asyncio.run(client.aclose())
