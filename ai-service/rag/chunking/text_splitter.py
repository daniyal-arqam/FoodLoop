from __future__ import annotations

import re
from dataclasses import dataclass

from rag.loaders.document_loader import Document, clean_text


@dataclass
class Chunk:
    chunk_id: str
    text: str
    path: str
    title: str
    topic: str
    chunk_index: int


def split_into_chunks(documents: list[Document], chunk_size: int = 700, overlap: int = 120) -> list[Chunk]:
    chunks: list[Chunk] = []
    for document in documents:
        parts = _window(document.text, chunk_size, overlap)
        for index, part in enumerate(parts):
            chunks.append(
                Chunk(
                    chunk_id=f"{document.path}#{index}",
                    text=part,
                    path=document.path,
                    title=document.title,
                    topic=document.topic,
                    chunk_index=index,
                )
            )
    return chunks


def _window(text: str, chunk_size: int, overlap: int) -> list[str]:
    paragraphs = [clean_text(part) for part in re.split(r"\n\s*\n", text) if clean_text(part)]
    if not paragraphs:
        return []

    pieces: list[str] = []
    buffer = ""
    for paragraph in paragraphs:
        candidate = f"{buffer}\n\n{paragraph}".strip() if buffer else paragraph
        if len(candidate) <= chunk_size:
            buffer = candidate
            continue
        if buffer:
            pieces.append(buffer)
        if len(paragraph) <= chunk_size:
            buffer = paragraph
        else:
            pieces.extend(_split_long(paragraph, chunk_size, overlap))
            buffer = ""
    if buffer:
        pieces.append(buffer)
    return pieces


def _split_long(text: str, chunk_size: int, overlap: int) -> list[str]:
    words = text.split()
    parts: list[str] = []
    start = 0
    while start < len(words):
        current: list[str] = []
        length = 0
        index = start
        while index < len(words):
            extra = len(words[index]) + (1 if current else 0)
            if current and length + extra > chunk_size:
                break
            current.append(words[index])
            length += extra
            index += 1
        parts.append(" ".join(current))
        if index >= len(words):
            break
        step_chars = max(chunk_size - overlap, 20)
        consumed = 0
        next_start = start
        while next_start < index and consumed < step_chars:
            consumed += len(words[next_start]) + 1
            next_start += 1
        start = max(next_start, start + 1)
    return parts
