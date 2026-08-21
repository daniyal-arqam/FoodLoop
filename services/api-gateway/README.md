# api-gateway

Public HTTP entry point for FoodLoop. Routes requests to downstream services and does not implement domain logic.

| Gateway path | Upstream |
|--------------|----------|
| `/api/auth/*` | Auth Service `/auth/*` |
| `/api/foods/*` | Food Service `/foods/*` |
| `/api/organizations/*` | Organization Service `/organizations/*` |
| `/api/matching/*` | Python Matcher `/*` |
| `/api/ai/*` | AI Service `/*` |

Also: `GET /health`.

Public without a JWT: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/matching/health`, `GET /api/ai/health`. Other `/api/*` routes require a Bearer token. Downstream services still enforce RBAC.

## Run

```bash
npm install
npm test
npm start
```
