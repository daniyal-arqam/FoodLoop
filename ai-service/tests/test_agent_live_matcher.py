import asyncio
import socket
import subprocess
import time
from pathlib import Path

import httpx
import pytest

from app.agent.executor import ToolExecutor
from app.agent.foodloop_client import FoodLoopClient
from tests.agent_fakes import KARACHI_FOOD_BANK, VEGETARIAN_LISTING, FakeFoodLoop

REPO_ROOT = Path(__file__).resolve().parents[2]
MATCHER_ROOT = REPO_ROOT / "python-services" / "matcher"


def _matcher_python() -> Path | None:
    windows = MATCHER_ROOT / ".venv" / "Scripts" / "python.exe"
    unix = MATCHER_ROOT / ".venv" / "bin" / "python"
    if windows.exists():
        return windows
    if unix.exists():
        return unix
    return None


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class HybridTransport(httpx.AsyncBaseTransport):
    def __init__(self, mock: FakeFoodLoop, matcher_url: str) -> None:
        self.mock = mock
        self.matcher_url = matcher_url.rstrip("/")
        self.live = httpx.AsyncHTTPTransport()

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        if str(request.url).startswith(self.matcher_url):
            return await self.live.handle_async_request(request)
        return self.mock.handler(request)

    async def aclose(self) -> None:
        await self.live.aclose()


@pytest.fixture(scope="module")
def live_matcher_url():
    python = _matcher_python()
    if python is None:
        pytest.skip("Matcher virtualenv is missing")
    port = _free_port()
    proc = subprocess.Popen(
        [str(python), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=str(MATCHER_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    url = f"http://127.0.0.1:{port}"
    try:
        deadline = time.time() + 25
        last_error = None
        while time.time() < deadline:
            if proc.poll() is not None:
                stderr = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
                pytest.skip(f"Matcher failed to start: {stderr}")
            try:
                response = httpx.get(f"{url}/health", timeout=1)
                if response.status_code == 200:
                    yield url
                    return
            except httpx.HTTPError as error:
                last_error = error
            time.sleep(0.2)
        pytest.skip(f"Matcher health check timed out: {last_error}")
    finally:
        proc.kill()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.terminate()


def test_agent_tools_score_real_foodloop_records_with_live_matcher(live_matcher_url):
    backend = FakeFoodLoop(
        listings=[VEGETARIAN_LISTING],
        organizations=[KARACHI_FOOD_BANK],
        require_auth=False,
        matcher_scores={},
    )
    transport = HybridTransport(backend, live_matcher_url)
    client = FoodLoopClient(
        authorization=None,
        transport=transport,
        food_service_url="http://localhost:4002",
        organization_service_url="http://localhost:4003",
        matcher_url=live_matcher_url,
    )
    executor = ToolExecutor(client)

    async def run():
        foods = await executor.execute(
            "find_available_food",
            {"category": "Prepared", "foodNameContains": "vegetarian"},
            "t-food",
        )
        orgs = await executor.execute("find_organizations", {"category": "Prepared"}, "t-orgs")
        scored = await executor.execute(
            "calculate_match_score",
            {"listingId": "listing-veg-1", "organizationId": "org-kitchen-1"},
            "t-score",
        )
        ranked = await executor.execute(
            "generate_match_recommendation",
            {"listingId": "listing-veg-1"},
            "t-rank",
        )
        await client.aclose()
        return foods, orgs, scored, ranked

    foods, orgs, scored, ranked = asyncio.run(run())

    assert foods["count"] == 1
    assert foods["listings"][0]["id"] == "listing-veg-1"
    assert foods["listings"][0]["foodName"] == "Vegetarian meal"
    assert foods["listings"][0]["quantity"] == 30
    assert orgs["organizations"][0]["organizationName"] == "Karachi Food Bank"

    rec = scored["recommendation"]
    assert rec["organizationName"] == "Karachi Food Bank"
    assert rec["listingName"] == "Vegetarian meal"
    assert rec["listingLocation"] == "12 Rescue Street, Karachi"
    assert rec["eligible"] is True
    assert 0 < rec["score"] <= 1
    assert rec["distanceKm"] == 0.0
    assert rec["quantityFit"] == 0.75
    assert rec["urgency"] > 0
    assert "Category matches" in rec["why"]

    recommendations = ranked["recommendations"]
    assert len(recommendations) == 1
    assert recommendations[0]["organizationId"] == "org-kitchen-1"
    assert recommendations[0]["score"] == rec["score"]
    assert {call["path"] for call in backend.calls} >= {"/foods", "/organizations"}
    matcher_calls = [call for call in backend.calls if str(call["url"]).startswith(live_matcher_url)]
    assert matcher_calls == []
    assert any(item["name"] == "calculate_match_score" and item["ok"] for item in executor.tool_calls)
