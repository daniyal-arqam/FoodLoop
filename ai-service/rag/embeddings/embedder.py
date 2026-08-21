from __future__ import annotations

import hashlib
import re

import numpy as np

from app.core.config import settings

TOKEN_RE = re.compile(r"[a-z0-9]+")


class HashingEmbedder:
    """Deterministic hashed n-gram embeddings. No API key required for ingestion or tests."""

    def __init__(self, dim: int | None = None) -> None:
        self.dim = dim or settings.embedding_dim

    def embed(self, texts: list[str]) -> np.ndarray:
        matrix = np.zeros((len(texts), self.dim), dtype=np.float32)
        for row, text in enumerate(texts):
            for token in _tokens(text):
                matrix[row, _bucket(token, self.dim)] += 1.0
            for gram in _char_grams(text, 3):
                matrix[row, _bucket(f"c:{gram}", self.dim)] += 0.5
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return matrix / norms


def _tokens(text: str) -> list[str]:
    tokens = TOKEN_RE.findall(text.lower())
    grams = tokens[:]
    grams.extend(f"{left}_{right}" for left, right in zip(tokens, tokens[1:]))
    return grams


def _char_grams(text: str, size: int) -> list[str]:
    compact = re.sub(r"\s+", " ", text.lower())
    if len(compact) < size:
        return [compact] if compact else []
    return [compact[index : index + size] for index in range(len(compact) - size + 1)]


def _bucket(token: str, dim: int) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "little") % dim
