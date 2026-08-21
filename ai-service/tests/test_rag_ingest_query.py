from rag.service import INSUFFICIENT_ANSWER, RagService, ingest_knowledge_base


class FakeLlm:
    def __init__(self) -> None:
        self.messages = None

    async def complete(self, messages, **kwargs):
        self.messages = messages
        context = messages[1]["content"]
        if "Prepared meals should be listed" in context or "redistributing prepared food" in context.lower():
            return "Confirm holding conditions, a short pickup window, and that the organization can use the prepared food."
        return INSUFFICIENT_ANSWER


def test_ingest_builds_faiss_index_and_query_is_grounded(tmp_path):
    knowledge = tmp_path / "kb"
    knowledge.mkdir()
    (knowledge / "prepared-food-redistribution.md").write_text(
        "---\ntitle: Redistributing prepared food\ntopic: redistribution\n---\n\n"
        "Before redistributing prepared food, confirm it was held under normal kitchen controls "
        "and can be collected quickly. Prepared meals should be listed with a short pickup window.\n",
        encoding="utf-8",
    )
    (knowledge / "storage.md").write_text(
        "---\ntitle: Storage\ntopic: storage\n---\n\nKeep dairy refrigerated until pickup.\n",
        encoding="utf-8",
    )
    output = tmp_path / "index"
    summary = ingest_knowledge_base(knowledge, output)
    assert summary["documents"] == 2
    assert summary["chunks"] >= 2
    assert (output / "index.faiss").exists()
    assert (output / "metadata.json").exists()

    llm = FakeLlm()
    rag = RagService.from_index(output, llm=llm)
    import asyncio

    grounded = asyncio.run(rag.query("What should we consider before redistributing prepared food?"))
    assert grounded["grounded"] is True
    assert "pickup" in grounded["answer"].lower() or "holding" in grounded["answer"].lower()
    assert grounded["sources"]
    assert all("title" in source and "path" in source for source in grounded["sources"])
    assert all(source["path"].endswith(".md") for source in grounded["sources"])
    assert "Prepared meals should be listed" in llm.messages[1]["content"]

    unknown = asyncio.run(rag.query("What is the capital of France and how do I file taxes?"))
    assert unknown["answer"] == INSUFFICIENT_ANSWER
    assert unknown["sources"] == []
    assert unknown["grounded"] is False
