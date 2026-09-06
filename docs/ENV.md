# Environment variables (`.env.example`)

This repo never commits a real `.env`. Copy the examples, fill secrets **only** in local `.env` files, Vercel, or your VPS `.env`.

```powershell
cd C:\Users\user\OneDrive\Desktop\FoodLoop
copy .env.example .env
copy frontend\.env.example frontend\.env
```

- `.env` is gitignored. Do not `git add .env`.
- `.env.example` / `.env.vps.example` are safe to commit. They use empty or fake values.
- Docker Compose and `scripts/dev.sh` read the **root** `.env`.
- Live VPS: copy `.env.vps.example` → `.env` on the VM ([DEPLOY-VPS.md](./DEPLOY-VPS.md)).

## What is secret

| Variable | Secret? | Where it lives |
|----------|---------|----------------|
| `MONGODB_URI` (with a real password) | Yes | Local `.env`, or Atlas if you skip Compose Mongo |
| `JWT_SECRET` | Yes | Local `.env`, VPS `.env` |
| `OPENAI_API_KEY` | Yes | Local `.env` / VPS `.env` (optional) |
| Google **Client Secret** | Yes | Do not use in this app. Do not commit. |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | No (public OAuth client id) | VPS `.env`, optional Vercel |
| `VITE_API_BASE_URL` | No | Frontend `.env` / Vercel |
| Ports, service URLs, matcher weights | No | Examples and ConfigMaps |

Never paste Atlas passwords, JWT secrets, or API keys into GitHub, chat, or screenshots.

---

## Root `.env.example`

Used by Docker Compose, local scripts, and as the single list of every knob.

| Variable | Meaning | Local default | Live (VPS / Vercel) |
|----------|---------|---------------|---------------------|
| `NODE_ENV` | `development` or `production` | `development` | `production` on the VPS |
| `MONGODB_URI` | Mongo connection string | `mongodb://localhost:27017/foodloop` | Compose uses `mongodb://mongodb:27017/foodloop` on the VPS; Atlas optional |
| `MONGO_PORT` | Host port for Compose Mongo | `27017` | Not published on VPS profile |
| `FRONTEND_PORT` | Vite / nginx publish port | `5173` | Vercel handles the SPA |
| `VITE_API_BASE_URL` | Frontend → gateway (no trailing slash) | `http://localhost:8080` | `http://YOUR_VM_IP:8080` (or HTTPS domain) |
| `GATEWAY_PORT` | API gateway listen port | `8080` | `8080` public on the VPS |
| `GATEWAY_URL` | Public gateway URL for scripts/seed | `http://localhost:8080` | Your VM gateway URL |
| `PROXY_TIMEOUT_MS` | Gateway proxy timeout | `10000` | VPS example uses `60000` |
| `CORS_ORIGINS` | Allowed browser origins | `*` | Can stay `*` for the demo |
| `AUTH_SERVICE_PORT` / `AUTH_SERVICE_URL` | Auth listen URL | `4001` | Internal Compose DNS on VPS |
| `JWT_SECRET` | Signs access tokens. Same value on gateway + auth + food + org | local placeholder | Long random string on VPS; never commit |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` | `1d` |
| `GOOGLE_CLIENT_ID` | Google OAuth **Web** client id | empty | VPS `.env` |
| `FOOD_SERVICE_PORT` / `FOOD_SERVICE_URL` | Food service | `4002` | Internal on VPS |
| `ORGANIZATION_SERVICE_PORT` / `ORGANIZATION_SERVICE_URL` | Org service | `4003` | Internal on VPS |
| `MATCHER_PORT` / `MATCHER_URL` | Python matcher | `8001` | Internal on VPS |
| `AI_SERVICE_PORT` / `AI_SERVICE_URL` | Python AI | `8002` | Internal on VPS |
| `AI_PROXY_TIMEOUT_MS` | Gateway wait for AI | `30000` | VPS example uses `55000` |
| `OPENAI_API_KEY` | Optional LLM key | empty | Optional on VPS |
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
| `VITE_API_BASE_URL` | Gateway base URL. Local: `http://localhost:8080`. Live: `http://YOUR_VM_IP:8080` (no trailing slash). |
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
- your Vercel URL (no trailing slash)

After setting `GOOGLE_CLIENT_ID` on the VPS, check:

`http://YOUR_VM_IP:8080/api/auth/google/config`

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
| `KEEPALIVE_ENABLED` | Optional self-ping (off on VPS by default) |

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
| VPS `.env` (from `.env.vps.example`) | `JWT_SECRET`, `CORS_ORIGINS`, optional `GOOGLE_CLIENT_ID` / `OPENAI_API_KEY` |
| Vercel (`frontend`) | `VITE_API_BASE_URL` = `http://YOUR_VM_IP:8080`; optional `VITE_GOOGLE_CLIENT_ID` |

Live deploy steps: [LIVE.md](./LIVE.md) · [DEPLOY-VPS.md](./DEPLOY-VPS.md).
