from rag.chunking.text_splitter import split_into_chunks
from rag.loaders.document_loader import Document


def test_split_into_chunks_keeps_source_metadata():
    document = Document(
        path="prepared-food-redistribution.md",
        title="Redistributing prepared food",
        text=("Prepared meals. " * 40) + "\n\n" + ("Collect quickly. " * 40),
        topic="redistribution",
    )
    chunks = split_into_chunks([document], chunk_size=120, overlap=20)
    assert len(chunks) >= 2
    assert all(chunk.path == document.path for chunk in chunks)
    assert all(chunk.title == document.title for chunk in chunks)
    assert chunks[0].chunk_id.endswith("#0")
