# FoodLoop

**Live demo:** [https://food-loop-theta.vercel.app](https://food-loop-theta.vercel.app)

FoodLoop is a food-rescue app. When a kitchen has edible surplus, it lists it. Verified community organizations nearby can find that listing, see a match score, claim a pickup, and mark it collected before the food expires.

I built it because that coordination usually happens in WhatsApp threads — people forget, listings go stale, and good food gets thrown out. FoodLoop keeps one shared listing status so the same tray cannot be claimed twice.

**Author:** Daniyal Arqam · [GitHub](https://github.com/daniyal-arqam/FoodLoop)

---

## Try it live

| | URL |
|--|-----|
| App | [https://food-loop-theta.vercel.app](https://food-loop-theta.vercel.app) |
| API health | [https://129.146.96.27.sslip.io/health](https://129.146.96.27.sslip.io/health) |

Frontend runs on **Vercel**. Backend (API gateway, auth, food, organizations, matcher, AI, MongoDB) runs on an **Oracle Always Free** VM with Docker — it stays up without the idle sleep you get on free PaaS hosts.

Demo logins (after seeding, or use Register / Google):

| Role | Email | Password |
|------|--------|----------|
| Provider | ayesha.provider@example.com | Password1 |
| Organization | kitchen.org@example.com | Password1 |
| Admin | admin@foodloop.org | AdminPass1 |

Seed walkthrough: [docs/DEMO.md](docs/DEMO.md).

---

## What it does

- **Providers** publish surplus (quantity, category, pickup window, expiry).
- **Admins** verify community organizations before they can claim.
- **Organizations** browse available food, see a Python match score (distance, quantity, category, urgency), reserve a listing, then mark it collected.
- **FoodLoop AI** helps with waste advice, food-safety Q&A (RAG over a small knowledge base), and matching help — all against the same live APIs, not a fake chat.

Listing lifecycle: `Available` → `Reserved` → `Collected` (or `Expired`).

---

## Tech stack

| Layer | What I used |
|--------|-------------|
| Frontend | React 18, Vite, React Router, GSAP, plain CSS |
| API edge | Node.js + Express gateway (JWT at the edge, proxies to services) |
| Services | Auth, food, organization — Node.js + Express + Mongoose |
| Matching | Python FastAPI (`FoodMatcher` scoring) |
| AI | Python FastAPI, FAISS RAG, optional OpenAI (works without a key via a demo LLM) |
| Database | MongoDB |
| Auth | JWT (HS256), bcrypt passwords, Google sign-in (ID token) |
| Local / VPS | Docker Compose |
| Optional | Kubernetes manifests, Terraform for cluster scaffolding |
| Live hosting | Vercel (UI) + Oracle Always Free Ampere VM (APIs + Mongo) + Caddy HTTPS |

---

## Architecture (short)

The browser only talks to the **API gateway**. Behind it:

```
Frontend (Vercel)
    → API Gateway
        → Auth service
        → Food service
        → Organization service
        → Matcher (Python)
        → AI service (Python)
    → MongoDB
```

More detail: [docs/architecture.md](docs/architecture.md).

---

## Run locally

**Need:** Node.js 20+, Python 3.11+, MongoDB (or Docker).

```bash
cp .env.example .env
./scripts/setup.sh
./scripts/dev.sh
```

Windows PowerShell: `.\scripts\start-local.ps1`.

Then open http://localhost:5173. Health check: `.\scripts\health-check.ps1` or `./scripts/health-check.sh`.

Env notes: [docs/ENV.md](docs/ENV.md).

### Docker Compose

```bash
docker compose build
docker compose up
```

### Seed sample data

```bash
./scripts/seed-demo.sh
```

---

## Deploy / live ops

- Overview: [docs/LIVE.md](docs/LIVE.md)
- Oracle / VPS steps: [docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md)

VPS profile publishes only the gateway (and optional Caddy for HTTPS). Frontend stays on Vercel with `VITE_API_BASE_URL` pointing at the public API.

---

## Docs

| Doc | About |
|-----|--------|
| [DEMO.md](docs/DEMO.md) | How to walk through a full demo |
| [architecture.md](docs/architecture.md) | Services and ports |
| [api-documentation.md](docs/api-documentation.md) | Gateway APIs |
| [database-schema.md](docs/database-schema.md) | Mongo collections |
| [SECURITY.md](docs/SECURITY.md) | Auth, RBAC, secrets |
| [FYP.md](docs/FYP.md) | Problem statement and future ideas |

---
