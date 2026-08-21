# FoodLoop knowledge base

Add documents here so the RAG assistant can answer questions about food safety, storage, donation, redistribution, waste reduction, and sustainability.

## Add a document

1. Create a UTF-8 Markdown (`.md`) or text (`.txt`) file in this folder.
2. Optional frontmatter:

   ```md
   ---
   title: Cold-chain pickup notes
   topic: storage
   ---
   ```

3. Write original operational guidance. Do not paste copyrighted regulations.
4. Re-run ingestion from `ai-service`:

   ```bash
   .venv\Scripts\python.exe scripts/ingest.py
   ```

The script reads every `.md` and `.txt` file except `README.md`, splits them into chunks, embeds them, and writes `data/rag/index.faiss` plus `data/rag/metadata.json`.

Restart the AI service after ingesting so it loads the new index.
