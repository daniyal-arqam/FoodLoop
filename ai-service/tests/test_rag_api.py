import pytest
from fastapi.testclient import TestClient

from app.api.rag import get_rag_service
from app.main import create_app
from rag.service import INSUFFICIENT_ANSWER, RagService, ingest_knowledge_base


class FakeLlm:
    async def complete(self, messages, **kwargs):
        context = messages[1]["content"]
        if "prepared food" in context.lower() or "Prepared meals" in context:
            return "List prepared meals with a short pickup window after confirming holding conditions."
        return INSUFFICIENT_ANSWER


@pytest.fixture
def rag_client(tmp_path):
    knowledge = tmp_path / "kb"
    knowledge.mkdir()
    (knowledge / "prepared-food-redistribution.md").write_text(
        "---\ntitle: Redistributing prepared food\ntopic: redistribution\n---\n\n"
        "Before redistributing prepared food, confirm holding conditions and a short pickup window. "
        "Prepared meals should be listed only when collection can happen promptly.\n",
        encoding="utf-8",
    )
    output = tmp_path / "index"
    ingest_knowledge_base(knowledge, output)
    service = RagService.from_index(output, llm=FakeLlm())
    application = create_app()
    application.dependency_overrides[get_rag_service] = lambda: service
    with TestClient(application) as client:
        yield client


def test_rag_query_endpoint_returns_answer_and_sources(rag_client):
    response = rag_client.post(
        "/ai/rag/query",
        json={"question": "What should we consider before redistributing prepared food?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["answer"]
    assert INSUFFICIENT_ANSWER not in body["data"]["answer"]
    assert body["data"]["sources"]
    assert body["data"]["sources"][0]["title"] == "Redistributing prepared food"
    assert "path" in body["data"]["sources"][0]


def test_rag_query_alias_and_unknown_question(rag_client):
    unknown = rag_client.post("/rag/query", json={"question": "How do I calculate orbital mechanics?"})
    assert unknown.status_code == 200
    assert unknown.json()["data"]["answer"] == INSUFFICIENT_ANSWER
    assert unknown.json()["data"]["sources"] == []


def test_rag_query_without_index_returns_503(tmp_path, monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "rag_index_dir", tmp_path / "missing-index")
    application = create_app()
    with TestClient(application) as client:
        response = client.post("/ai/rag/query", json={"question": "What should we consider before redistributing prepared food?"})
    assert response.status_code == 503
    assert "ingest.py" in response.json()["message"]
