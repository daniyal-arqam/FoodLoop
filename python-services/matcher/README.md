# FoodLoop Matcher

Python FastAPI + OOP matching for food listings and organizations.

## `FoodMatcher`

- `calculate_match_score(listing, organization)` — component + total score
- `find_matches(listing, organizations)` — filter, score, rank
- `rank_matches(matches)` — highest score first

## `WasteAnalyzer` / `SustainabilityCalculator`

- Diverted vs expired portions and kg from listing status
- Heuristic CO₂ and water from diverted kg
- HTTP: `POST /matching/impact`

Weights (configurable): distance 35%, quantity 25%, category 20%, urgency 20%.

## Endpoints

| Method | Path |
|--------|------|
| GET | `/health` |
| POST | `/matching/find` (alias `/find`) |
| POST | `/matching/score` (alias `/score`) |
| POST | `/matching/impact` (alias `/impact`) |

## Run

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m pytest
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8001
```
