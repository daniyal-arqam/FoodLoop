# FoodLoop AI Service

Python FastAPI service for the waste-reduction advisor, RAG knowledge assistant, and food matching agent.

## Endpoints

| Method | Path | Auth at gateway |
|--------|------|-----------------|
| GET | `/health` | public |
| POST | `/ai/recommend` (alias `/recommend`) | JWT via `/api/ai/recommend` |
| POST | `/ai/rag/query` (alias `/rag/query`) | JWT via `/api/ai/rag/query` |
| POST | `/ai/agent` (alias `/agent`) | JWT via `/api/ai/agent` |

## Matching agent

`POST /ai/agent` runs a tool-using agent against live FoodLoop services. It does not invent listings, organizations, or scores.

Tools:

1. `find_available_food` — `GET` food-service `/foods?status=Available`
2. `find_organizations` — `GET` organization-service `/organizations`
3. `calculate_match_score` — `POST` matcher `/score`
4. `generate_match_recommendation` — `POST` matcher `/find`, then rank

The agent forwards the caller's `Authorization` header to food and organization APIs. Set `FOOD_SERVICE_URL`, `ORGANIZATION_SERVICE_URL`, and `MATCHER_URL`.

## RAG

Documents in `knowledge-base/` are loaded, chunked, embedded, and stored in FAISS (`data/rag/`).

```bash
.venv\Scripts\python.exe scripts/ingest.py
```

How to add documents: see [knowledge-base/README.md](knowledge-base/README.md).

The RAG assistant answers only from retrieved chunks. If coverage is weak it replies: "The available knowledge base does not provide sufficient information." Sources come from stored chunk metadata, not from the model.

## Environment

Set `OPENAI_API_KEY` (or `AI_API_KEY`) for generation. Optional: `OPENAI_BASE_URL`, `OPENAI_MODEL`, `AI_TIMEOUT_SECONDS`, `RAG_INDEX_DIR`, `RAG_KNOWLEDGE_DIR`, `FOOD_SERVICE_URL`, `ORGANIZATION_SERVICE_URL`, `MATCHER_URL`.

## Run

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python.exe scripts/ingest.py
.venv\Scripts\python.exe -m pytest
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8002
```
