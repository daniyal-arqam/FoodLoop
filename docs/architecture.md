# FoodLoop architecture

Modular microservices. Each service has one responsibility and is independently runnable. The React app talks only to the API gateway.

## Services

- **frontend** — React (Vite). Provider, organization, and admin dashboards plus the FoodLoop AI workspace. Port 5173.
- **api-gateway** — Public HTTP entry. JWT at the edge; proxies `/api/auth`, `/api/foods`, `/api/organizations`, `/api/matching`, `/api/ai`. Port 8080.
- **auth-service** — Registration, login, bcrypt password hashes, HS256 JWT, Admin RBAC. Port 4001.
- **food-service** — Listings, search/filter, claim → Reserved, collect → Collected, expiry. Port 4002.
- **organization-service** — Organization profiles, verification (Admin), search for matching. Port 4003.
- **matcher** — Python FastAPI. OOP `FoodMatcher` with `calculate_match_score()`, `find_matches()`, and `rank_matches()`. Port 8001.
- **ai-service** — Waste-reduction advisor (OpenAI or structured demo LLM), food-safety RAG (FAISS), matching agent with live FoodLoop tools. Port 8002.

## Data

MongoDB is the system of record. Mongoose models live in the owning Node service:

- **auth-service** — `User`
- **food-service** — `FoodListing`, `Claim`
- **organization-service** — `Organization`

Food-service also reads the same `organizations` collection (verified flag) so claim eligibility stays consistent without a sync job.

Shared enums and connection helpers are in `services/shared`. HTTP services still boot without MongoDB so health checks keep working. Connect with `src/config/database.js` when a URI is available.

## Health contract

All HTTP services expose a JSON health payload:

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "<service-name>",
    "status": "ok",
    "timestamp": "<iso-8601>"
  }
}
```

Frontend serves the same shape from `/health.json`. The AI health payload also includes `ragIndexReady`.

## Ports

See the root `.env.example` and `README.md`.

## Demo

Deterministic accounts and listings: `./scripts/seed-demo.sh`. Walkthrough: [DEMO.md](./DEMO.md).

## Submission docs (PS-04)

- [FYP.md](./FYP.md) — problem, users, future work
- [architecture.svg](./architecture.svg) / [architecture.png](./architecture.png)
- [database-schema.md](./database-schema.md) / [database-schema.svg](./database-schema.svg) / [database-schema.png](./database-schema.png)
- [api-documentation.md](./api-documentation.md) / [api-documentation.html](./api-documentation.html) (print to PDF)
- [presentation.md](./presentation.md)

