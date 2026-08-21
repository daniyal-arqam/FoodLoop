from __future__ import annotations

import json
from pathlib import Path

import faiss
import numpy as np


class FaissVectorStore:
    def __init__(self, index, metadata: list[dict], dim: int) -> None:
        self.index = index
        self.metadata = metadata
        self.dim = dim

    @classmethod
    def build(cls, vectors: np.ndarray, metadata: list[dict]) -> "FaissVectorStore":
        if vectors.ndim != 2 or vectors.shape[0] != len(metadata):
            raise ValueError("vectors and metadata must align")
        dim = vectors.shape[1]
        matrix = np.ascontiguousarray(vectors.astype(np.float32))
        faiss.normalize_L2(matrix)
        index = faiss.IndexFlatIP(dim)
        index.add(matrix)
        return cls(index, metadata, dim)

    def search(self, query_vectors: np.ndarray, top_k: int = 4) -> list[list[tuple[int, float]]]:
        matrix = np.ascontiguousarray(query_vectors.astype(np.float32))
        if matrix.ndim == 1:
            matrix = matrix.reshape(1, -1)
        faiss.normalize_L2(matrix)
        k = min(top_k, max(self.index.ntotal, 1))
        scores, ids = self.index.search(matrix, k)
        results = []
        for row_scores, row_ids in zip(scores, ids):
            hits = []
            for score, idx in zip(row_scores, row_ids):
                if idx < 0:
                    continue
                hits.append((int(idx), float(score)))
            results.append(hits)
        return results

    def save(self, directory: str | Path) -> None:
        output = Path(directory)
        output.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(output / "index.faiss"))
        payload = {"dim": self.dim, "metadata": self.metadata}
        (output / "metadata.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, directory: str | Path) -> "FaissVectorStore":
        path = Path(directory)
        index_path = path / "index.faiss"
        meta_path = path / "metadata.json"
        if not index_path.exists() or not meta_path.exists():
            raise FileNotFoundError("Knowledge index not found. Run python scripts/ingest.py")
        index = faiss.read_index(str(index_path))
        payload = json.loads(meta_path.read_text(encoding="utf-8"))
        return cls(index, payload["metadata"], payload["dim"])
