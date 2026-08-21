from __future__ import annotations

import re
from dataclasses import dataclass

from rag.embeddings.embedder import HashingEmbedder
from rag.vector_store.faiss_store import FaissVectorStore

STOPWORDS = {
    "a",
    "an",
    "the",
    "and",
    "or",
    "of",
    "to",
    "for",
    "in",
    "on",
    "at",
    "is",
    "are",
    "be",
    "we",
    "what",
    "should",
    "how",
    "do",
    "does",
    "before",
    "after",
    "with",
    "about",
}


@dataclass
class RetrievedChunk:
    text: str
    score: float
    path: str
    title: str
    topic: str
    chunk_id: str
    chunk_index: int

    def as_source(self) -> dict:
        return {
            "title": self.title,
            "path": self.path,
            "topic": self.topic,
            "chunkId": self.chunk_id,
            "chunkIndex": self.chunk_index,
            "score": round(self.score, 4),
        }


class FaissRetriever:
    def __init__(self, store: FaissVectorStore, embedder: HashingEmbedder | None = None) -> None:
        self.store = store
        self.embedder = embedder or HashingEmbedder(store.dim)

    def search(self, question: str, top_k: int = 4, min_score: float = 0.18) -> list[RetrievedChunk]:
        vectors = self.embedder.embed([question])
        ranked = self.store.search(vectors, top_k=top_k)[0]
        hits: list[RetrievedChunk] = []
        for idx, score in ranked:
            if score < min_score:
                continue
            meta = self.store.metadata[idx]
            chunk = RetrievedChunk(
                text=meta["text"],
                score=score,
                path=meta["path"],
                title=meta["title"],
                topic=meta["topic"],
                chunk_id=meta["chunk_id"],
                chunk_index=meta["chunk_index"],
            )
            if not _has_overlap(question, chunk.text):
                continue
            hits.append(chunk)
        return hits


def _has_overlap(question: str, chunk: str, minimum: int = 2) -> bool:
    question_tokens = _content_tokens(question)
    chunk_tokens = _content_tokens(chunk)
    if len(question_tokens) <= 2:
        minimum = 1
    return len(question_tokens & chunk_tokens) >= minimum


def _content_tokens(text: str) -> set[str]:
    tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
    return {token for token in tokens if token not in STOPWORDS and len(token) > 2}
