from rag.loaders.document_loader import clean_text, load_documents, parse_frontmatter


def test_clean_text_normalizes_whitespace():
    assert clean_text("Keep   surplus\r\n\r\n\r\nfood") == "Keep surplus\n\nfood"


def test_parse_frontmatter_and_load_knowledge_base(tmp_path):
    (tmp_path / "sample.md").write_text(
        "---\ntitle: Demo Doc\ntopic: storage\n---\n\n# Heading\n\nRefrigerate dairy surplus.\n",
        encoding="utf-8",
    )
    (tmp_path / "README.md").write_text("ignore me", encoding="utf-8")
    meta, body = parse_frontmatter((tmp_path / "sample.md").read_text(encoding="utf-8"))
    assert meta["title"] == "Demo Doc"
    assert "Refrigerate" in body

    documents = load_documents(tmp_path)
    assert len(documents) == 1
    assert documents[0].title == "Demo Doc"
    assert documents[0].topic == "storage"
    assert documents[0].path == "sample.md"
