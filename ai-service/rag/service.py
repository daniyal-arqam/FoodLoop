INSUFFICIENT_ANSWER = (
    "The available knowledge base does not provide sufficient information."
)

RAG_SYSTEM_PROMPT = """You are FoodLoop's knowledge assistant for food safety, storage, donation, and redistribution.

Answer using ONLY the retrieved context below.
If the context is not enough to answer, reply with exactly:
The available knowledge base does not provide sufficient information.

Do not invent statistics, regulations, or citations.
Do not mention sources that are not in the retrieved context.
Keep the answer concise and practical.
"""


def ingest_knowledge_base(knowledge_dir, output_dir, chunk_size: int = 700, overlap: int = 120) -> dict:
    from rag.chunking.text_splitter import split_into_chunks
    from rag.embeddings.embedder import HashingEmbedder
    from rag.loaders.document_loader import load_documents
    from rag.vector_store.faiss_store import FaissVectorStore

    documents = load_documents(knowledge_dir)
    chunks = split_into_chunks(documents, chunk_size=chunk_size, overlap=overlap)
    if not chunks:
        raise ValueError("No knowledge chunks were produced. Add markdown or text files to the knowledge base.")

    embedder = HashingEmbedder()
    vectors = embedder.embed([chunk.text for chunk in chunks])
    metadata = [
        {
            "chunk_id": chunk.chunk_id,
            "text": chunk.text,
            "path": chunk.path,
            "title": chunk.title,
            "topic": chunk.topic,
            "chunk_index": chunk.chunk_index,
        }
        for chunk in chunks
    ]
    store = FaissVectorStore.build(vectors, metadata)
    store.save(output_dir)
    return {
        "documents": len(documents),
        "chunks": len(chunks),
        "dim": store.dim,
        "outputDir": str(output_dir),
    }


class RagService:
    def __init__(self, store=None, retriever=None, llm=None) -> None:
        from rag.retriever.faiss_retriever import FaissRetriever

        self.store = store
        self.retriever = retriever
        self.llm = llm
        if self.llm is None:
            from app.advisor.demo_llm import get_default_llm

            self.llm = get_default_llm()
        if self.retriever is None and self.store is not None:
            self.retriever = FaissRetriever(self.store)

    @classmethod
    def from_index(cls, index_dir, llm=None) -> "RagService":
        from rag.vector_store.faiss_store import FaissVectorStore

        store = FaissVectorStore.load(index_dir)
        return cls(store=store, llm=llm)

    async def query(self, question: str, top_k: int | None = None, min_score: float | None = None) -> dict:
        from app.core.config import settings

        if self.retriever is None:
            raise FileNotFoundError("Knowledge index not found. Run python scripts/ingest.py")

        hits = self.retriever.search(
            question,
            top_k=top_k or settings.rag_top_k,
            min_score=min_score if min_score is not None else settings.rag_min_score,
        )
        if not hits:
            return {
                "answer": INSUFFICIENT_ANSWER,
                "sources": [],
                "grounded": False,
            }

        context = "\n\n".join(
            f"Source title: {hit.title}\nSource path: {hit.path}\n{hit.text}" for hit in hits
        )
        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Question: {question}\n\nRetrieved context:\n{context}",
            },
        ]
        answer = (await self.llm.complete(messages, json_mode=False)).strip()
        if not answer or INSUFFICIENT_ANSWER.lower() in answer.lower():
            return {
                "answer": INSUFFICIENT_ANSWER,
                "sources": [],
                "grounded": False,
            }
        return {
            "answer": answer,
            "sources": [hit.as_source() for hit in hits],
            "grounded": True,
        }
