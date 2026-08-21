import asyncio

from app.agent.executor import ToolExecutor
from app.agent.foodloop_client import FoodLoopClient
from app.agent.schemas import FindAvailableFoodArgs
from tests.agent_fakes import FakeFoodLoop


def test_find_available_food_schema_rejects_unknown_fields():
    try:
        FindAvailableFoodArgs.model_validate({"category": "Prepared", "madeUp": True})
        assert False, "expected validation error"
    except Exception as error:
        assert "madeUp" in str(error) or "extra" in str(error).lower()


def test_find_available_food_schema_rejects_invalid_category():
    try:
        FindAvailableFoodArgs.model_validate({"category": "Vegetarian Meals"})
        assert False, "expected validation error"
    except Exception as error:
        assert "category" in str(error).lower() or "literal" in str(error).lower()


def test_executor_returns_schema_error_for_extra_fields():
    backend = FakeFoodLoop(require_auth=False)
    client = FoodLoopClient(
        transport=backend.transport(),
        food_service_url="http://localhost:4002",
        organization_service_url="http://localhost:4003",
        matcher_url="http://localhost:8001",
    )
    executor = ToolExecutor(client)

    async def run():
        result = await executor.execute(
            "find_available_food",
            {"category": "Prepared", "inventedFilter": "nope"},
            "bad",
        )
        await client.aclose()
        return result

    result = asyncio.run(run())
    assert result["error"] == "Invalid tool arguments"
    assert executor.tool_calls[0]["ok"] is False
