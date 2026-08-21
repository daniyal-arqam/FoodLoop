import numpy as np

from rag.embeddings.embedder import HashingEmbedder


def test_embeddings_are_normalized_and_deterministic():
    embedder = HashingEmbedder(dim=64)
    first = embedder.embed(["prepared food redistribution"])
    second = embedder.embed(["prepared food redistribution"])
    other = embedder.embed(["unrelated astronomy lecture"])
    assert first.shape == (1, 64)
    np.testing.assert_allclose(first, second)
    assert abs(np.linalg.norm(first) - 1.0) < 1e-5
    prepared = embedder.embed(["prepared meals pickup window"])
    related = float(np.dot(prepared[0], first[0]))
    unrelated = float(np.dot(other[0], first[0]))
    assert related > unrelated
