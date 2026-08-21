# Environment variables (`.env.example`)

This repo never commits a real `.env`. Copy the examples, fill secrets **only** in local `.env` files or in Vercel / Render dashboards.

```powershell
cd C:\Users\user\OneDrive\Desktop\FoodLoop
copy .env.example .env
copy frontend\.env.example frontend\.env
```

- `.env` is gitignored. Do not `git add .env`.
- `.env.example` files are safe to commit. They use empty or fake values.
- Docker Compose and `scripts/dev.sh` read the **root** `.env`.

## What is secret

| Variable | Secret? | Where it lives |
|----------|---------|----------------|
| `MONGODB_URI` (with a real password) | Yes | Local `.env`, Render auth/food/org |
| `JWT_SECRET` | Yes | Local `.env`, Render shared group |
| `OPENAI_API_KEY` | Yes | Local `.env` / AI service, Render `foodloop-ai` (optional) |
| Google **Client Secret** | Yes | Do not use in this app. Do not commit. |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | No (public OAuth client id) | Render `foodloop-auth`, optional Vercel |
| `VITE_API_BASE_URL` | No | Frontend `.env` / Vercel |
| Ports, service URLs, matcher weights | No | Examples and ConfigMaps |

Never paste Atlas passwords, JWT secrets, or API keys into GitHub, chat, or screenshots.

---

## Root `.env.example`

Used by Docker Compose, local scripts, and as the single list of every knob.

| Variable | Meaning | Local default | Live (Render / Vercel) |
|----------|---------|---------------|------------------------|
| `NODE_ENV` | `development` or `production` | `development` | Render sets `production` |
| `MONGODB_URI` | Mongo connection string | `mongodb://localhost:27017/foodloop` | Atlas `mongodb+srv://USER:PASSWORD@…/foodloop?retryWrites=true&w=majority` |
| `MONGO_PORT` | Host port for Compose Mongo | `27017` | Not used on Atlas |
| `FRONTEND_PORT` | Vite / nginx publish port | `5173` | Vercel handles this |
| `VITE_API_BASE_URL` | Frontend → gateway (no trailing slash) | `http://localhost:8080` | `https://foodloop-gateway.onrender.com` |
| `GATEWAY_PORT` | API gateway listen port | `8080` | Render sets `PORT` |
| `GATEWAY_URL` | Public gateway URL for scripts/seed | `http://localhost:8080` | Your Render gateway URL |
| `PROXY_TIMEOUT_MS` | Gateway proxy timeout | `10000` | Live uses a higher value in `render.yaml` |
| `CORS_ORIGINS` | Allowed browser origins | `*` | Can stay `*` on the free demo |
| `AUTH_SERVICE_PORT` / `AUTH_SERVICE_URL` | Auth listen URL | `4001` | Render internal URL |
| `JWT_SECRET` | Signs access tokens. Same value on gateway + auth + food + org | local placeholder | Generate on Render; never commit the real one |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` | `1d` |
| `GOOGLE_CLIENT_ID` | Google OAuth **Web** client id (`….apps.googleusercontent.com`) | empty | Render `foodloop-auth` |
| `FOOD_SERVICE_PORT` / `FOOD_SERVICE_URL` | Food service | `4002` | Render |
| `ORGANIZATION_SERVICE_PORT` / `ORGANIZATION_SERVICE_URL` | Org service | `4003` | Render |
| `MATCHER_PORT` / `MATCHER_URL` | Python matcher | `8001` | Render |
| `AI_SERVICE_PORT` / `AI_SERVICE_URL` | Python AI | `8002` | Render |
| `AI_PROXY_TIMEOUT_MS` | Gateway wait for AI | `30000` | Render |
| `OPENAI_API_KEY` | Optional LLM key | empty | Optional on `foodloop-ai` |
| `OPENAI_BASE_URL` | OpenAI-compatible API | `https://api.openai.com/v1` | Same unless you use a proxy |
| `OPENAI_MODEL` | Chat model | `gpt-4o-mini` | Same |
| `AI_TIMEOUT_SECONDS` | LLM call timeout | `25` | Same |
| `FOODLOOP_TIMEOUT_SECONDS` | AI → FoodLoop API timeout | `10` | Same |
| `AGENT_MAX_STEPS` | Matching-agent tool loop cap | `8` | Same |

---

## Frontend `frontend/.env.example`

Vite only exposes names that start with `VITE_`. Changing them requires a **rebuild / Vercel redeploy**.

| Variable | Meaning |
|----------|---------|
| `VITE_API_BASE_URL` | Gateway base URL. Local: `http://localhost:8080`. Live: Render gateway, no `/` at the end. |
| `VITE_GOOGLE_CLIENT_ID` | Optional. Same Google client id as auth `GOOGLE_CLIENT_ID`. If empty, the app reads the id from `GET /api/auth/google/config`. |

---

## Auth `services/auth-service/.env.example`

| Variable | Meaning |
|----------|---------|
| `PORT` | Listen port (`4001`) |
| `SERVICE_NAME` | Health payload name |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | Users collection |
| `JWT_SECRET` | Must match the gateway |
| `JWT_EXPIRES_IN` | e.g. `1d` |
| `GOOGLE_CLIENT_ID` | Required for Continue with Google. Public client id only — not the client secret. |

Google Cloud → Credentials → OAuth client (Web). Authorized JavaScript origins:

- `http://localhost:5173`
- `https://food-loop-theta.vercel.app` (no trailing slash)

After setting `GOOGLE_CLIENT_ID` on Render `foodloop-auth`, check:

`https://YOUR-GATEWAY.onrender.com/api/auth/google/config`

`data.clientId` should be the id string, not `null`.

---

## Gateway `services/api-gateway/.env.example`

| Variable | Meaning |
|----------|---------|
| `PORT` | `8080` |
| `AUTH_SERVICE_URL`, `FOOD_SERVICE_URL`, `ORGANIZATION_SERVICE_URL`, `MATCHER_URL`, `AI_SERVICE_URL` | Upstream bases |
| `JWT_SECRET` | Same as auth |
| `PROXY_TIMEOUT_MS` | Downstream HTTP timeout |
| `CORS_ORIGINS` | Browser origins |

---

## Food & organization services

Same pattern: `PORT`, `SERVICE_NAME`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`. All three Mongo services (auth, food, org) must use the **same database** (`foodloop`).

---

## Matcher `python-services/matcher/.env.example`

Scoring weights and caps. Not secrets. Defaults are fine for the demo.

---

## AI `ai-service/.env.example`

| Variable | Meaning |
|----------|---------|
| `OPENAI_API_KEY` | Secret. Leave empty to use the built-in demo LLM. |
| `FOOD_SERVICE_URL`, `ORGANIZATION_SERVICE_URL`, `MATCHER_URL` | Live FoodLoop APIs the agent calls |

---

## Local vs live (short)

**Laptop**

1. Copy root `.env.example` → `.env`.
2. Keep `JWT_SECRET` as the local placeholder (or any long string you do not commit).
3. Leave `OPENAI_API_KEY` and `GOOGLE_CLIENT_ID` empty unless you want those features locally.
4. `cp frontend/.env.example frontend/.env` if you run Vite outside Compose.

**Live**

| Place | Set these |
|-------|-----------|
| Render `foodloop-shared` | `JWT_SECRET` (generated), `JWT_EXPIRES_IN`, `CORS_ORIGINS` |
| Render auth, food, org | `MONGODB_URI` (Atlas, secret) |
| Render `foodloop-auth` | `GOOGLE_CLIENT_ID` (public id) |
| Render `foodloop-ai` | `OPENAI_API_KEY` optional |
| Vercel (`frontend`) | `VITE_API_BASE_URL`; optional `VITE_GOOGLE_CLIENT_ID` |

Live deploy steps: [LIVE.md](./LIVE.md).
