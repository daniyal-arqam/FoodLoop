# Live deploy (Vercel + always-on VPS)

Public MVP for LoopLearn PS-04.

| Layer | Host | Cost |
|-------|------|------|
| Frontend | **Vercel** | Free |
| APIs (gateway + auth + food + org + matcher + AI + Mongo) | **Oracle Cloud Always Free** Ampere VM (or any Docker VPS) | Free |
| Optional hosted DB | MongoDB Atlas M0 | Free (only if you skip Compose Mongo) |

This replaces **Render**. Free Render web services sleep after idle; a VPS does not. Full steps: [DEPLOY-VPS.md](./DEPLOY-VPS.md).

Do not commit Atlas passwords or filled `.env` files.

## Quick path

1. Create an **Oracle Always Free** Ampere Ubuntu VM (see [DEPLOY-VPS.md](./DEPLOY-VPS.md) § Oracle).
2. Install Docker, clone the repo, copy `.env.vps.example` → `.env`, set `JWT_SECRET`.
3. Run `./scripts/deploy-vps.sh`.
4. On Vercel set `VITE_API_BASE_URL=http://YOUR_VM_IP:8080` and **Redeploy**.
5. In the [Render dashboard](https://dashboard.render.com), delete the old `foodloop-*` services if they still exist.

## What to submit

| Item | URL |
|------|-----|
| Live app | Vercel frontend |
| API (optional) | `http://YOUR_VM_IP:8080/health` |
| GitHub | `https://github.com/daniyal-arqam/FoodLoop` |

Judges should use the **Vercel** link, not localhost.

## Google sign-in

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth client (Web).
2. Authorized JavaScript origins: `http://localhost:5173` and your Vercel URL.
3. Same Client ID in VPS `.env` (`GOOGLE_CLIENT_ID`) and Vercel (`VITE_GOOGLE_CLIENT_ID`).

## Seed demo accounts

```powershell
$env:GATEWAY_URL="http://YOUR_VM_IP:8080"
node scripts/demo/seed-cli.js
```

Then log in with [DEMO.md](./DEMO.md) accounts.

## If something fails

| Symptom | Likely fix |
|---------|------------|
| Vercel UI loads, login fails | `VITE_API_BASE_URL` wrong — set droplet/VM gateway URL and redeploy frontend |
| Curl to `:8080` times out | Oracle VCN / Security List missing ingress TCP 8080 (and 22) |
| Containers restart / OOM | Use at least ~6–12 GB RAM on Ampere (or 2 GB on x86 Student Pack droplets) |
| Google sign-in broken | Same Client ID on VPS + Vercel; JS origin = Vercel URL |
| JWT errors after recreate | Keep the same `JWT_SECRET` in `.env` across deploys |
