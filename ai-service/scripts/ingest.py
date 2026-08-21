"""Build the FoodLoop RAG FAISS index from knowledge-base documents."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from rag.service import ingest_knowledge_base  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest FoodLoop knowledge documents into FAISS")
    parser.add_argument(
        "--knowledge-dir",
        default=str(AI_ROOT / "knowledge-base"),
        help="Folder of markdown/text documents",
    )
    parser.add_argument(
        "--output-dir",
        default=str(AI_ROOT / "data" / "rag"),
        help="Where to write index.faiss and metadata.json",
    )
    args = parser.parse_args()
    summary = ingest_knowledge_base(args.knowledge_dir, args.output_dir)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
