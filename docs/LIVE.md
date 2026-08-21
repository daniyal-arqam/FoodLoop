# Live deploy (Vercel + Render + Atlas)

Public MVP for LoopLearn PS-04. Frontend is on Vercel. API gateway, auth, food, organizations, matcher, and AI run as Render web services. MongoDB is Atlas (free M0). Do not commit Atlas passwords or `.env` files.

Free Render services sleep after about 15 minutes idle. Open the gateway `/health` URL once before a judged demo so containers wake up.

## 1. MongoDB Atlas

1. Sign up at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (GitHub login is fine).
2. Create a project, then a cluster: **M0 Free**, any nearby region (for example Singapore or Bahrain).
3. **Database Access** → Add user → password auth. Save the password. Avoid `@`, `#`, `%` in the password so the URI stays simple.
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`). Render IPs are not fixed.
5. **Connect** → Drivers → copy the URI. Put the password in, and set the database name to `foodloop`:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/foodloop?retryWrites=true&w=majority
```

Keep this string private. You will paste it into Render only.

## 2. Push this repo (including `render.yaml`)

From the project folder, after you commit the live-deploy files:

```powershell
git add render.yaml frontend/vercel.json docs/LIVE.md README.md
git commit -m "Add Vercel, Render, and Atlas live deploy files."
git push origin main
```

## 3. Render (backends)

1. Sign up at [https://dashboard.render.com](https://dashboard.render.com) with GitHub.
2. **New** → **Blueprint**.
3. Select `daniyal-arqam/FoodLoop`, branch `main`.
4. When prompted for **MONGODB_URI**, paste the Atlas URI (same value for auth, food, and org — three times).
5. Apply the Blueprint. First Docker builds can take 15–25 minutes. OpenAI is optional; the demo LLM works without a key.
6. Open the **foodloop-gateway** service → copy its public URL, for example `https://foodloop-gateway.onrender.com`.
7. Check `https://YOUR-GATEWAY.onrender.com/health` — you want `{ "success": true, ... }`. If it times out, wait and retry (cold start).

If a service is **OOM** (often `foodloop-ai` on 512 MB), bump only that service to the Starter plan.

## 4. Vercel (frontend)

1. Sign up at [https://vercel.com](https://vercel.com) with GitHub.
2. **Add New** → **Project** → `FoodLoop`.
3. **Root Directory** → `frontend` (Edit, not the repo root).
4. Framework: Vite. Build: `npm run build`. Output: `dist`.
5. **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | the Render gateway URL, no trailing slash |

6. Deploy. Copy the frontend URL, for example `https://foodloop-xxx.vercel.app`.

If you set `VITE_API_BASE_URL` after the first deploy, **Redeploy** so Vite bakes the gateway URL into the JS bundle.

## 5. Seed demo accounts

On your laptop (auth-service `npm install` already done from local setup):

```powershell
cd C:\Users\user\OneDrive\Desktop\FoodLoop
$env:GATEWAY_URL="https://YOUR-GATEWAY.onrender.com"
$env:MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/foodloop?retryWrites=true&w=majority"
node scripts/demo/seed-cli.js
```

Then log in on the Vercel URL using [DEMO.md](./DEMO.md) accounts.

## 6. What to submit

| Item | URL |
|------|-----|
| Live app | Vercel frontend |
| API (optional) | `https://YOUR-GATEWAY.onrender.com/health` |
| GitHub | `https://github.com/daniyal-arqam/FoodLoop` |

Judges should use the **Vercel** link, not localhost.

## If something fails

| Symptom | Likely fix |
|---------|------------|
| Vercel UI loads, login fails | `VITE_API_BASE_URL` missing or wrong — set it and redeploy frontend |
| Gateway 502 | A backend is still building or asleep — open each service `/health` |
| Atlas connection error | Network Access `0.0.0.0/0`; password encoded in the URI |
| Seed cannot create admin | `MONGODB_URI` must be the Atlas URI, not localhost |
| CORS errors | Shared group already uses `CORS_ORIGINS=*`; wait for gateway restart |
