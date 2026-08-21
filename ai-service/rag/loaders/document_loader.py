from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
WHITESPACE_RE = re.compile(r"[ \t]+")


@dataclass
class Document:
    path: str
    title: str
    text: str
    topic: str = "general"
    metadata: dict = field(default_factory=dict)


def clean_text(text: str) -> str:
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = WHITESPACE_RE.sub(" ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(raw)
    if not match:
        return {}, raw
    meta = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, raw[match.end() :]


def title_from(path: Path, meta: dict, body: str) -> str:
    if meta.get("title"):
        return meta["title"]
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem.replace("-", " ").title()


def load_documents(knowledge_dir: str | Path) -> list[Document]:
    root = Path(knowledge_dir)
    if not root.exists():
        raise FileNotFoundError(f"Knowledge base not found: {root}")

    documents = []
    files = sorted([*root.glob("**/*.md"), *root.glob("**/*.txt")])
    for path in files:
        if path.name.lower() == "readme.md":
            continue
        raw = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        text = clean_text(body)
        if not text:
            continue
        relative = path.relative_to(root).as_posix()
        documents.append(
            Document(
                path=relative,
                title=title_from(path, meta, body),
                text=text,
                topic=meta.get("topic") or path.parent.name,
                metadata=meta,
            )
        )
    return documents
