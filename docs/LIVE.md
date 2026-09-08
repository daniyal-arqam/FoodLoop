# Live deploy

FoodLoop’s public stack:

| Layer | Host | Cost |
|-------|------|------|
| Frontend | [Vercel](https://food-loop-theta.vercel.app) | Free |
| APIs + Mongo | Oracle Always Free Ampere VM (Docker Compose) | Free, always on |
| HTTPS | Caddy on the VM (`*.sslip.io` or your domain) | Free |

Full VM setup: [DEPLOY-VPS.md](./DEPLOY-VPS.md).

Do not commit filled `.env` files or database passwords.

## Live links

| Item | URL |
|------|-----|
| App | https://food-loop-theta.vercel.app |
| API health | https://129.146.96.27.sslip.io/health |
| GitHub | https://github.com/daniyal-arqam/FoodLoop |

If the VM public IP changes, update `GATEWAY_DOMAIN` / Caddy and set Vercel `VITE_API_BASE_URL` to the new HTTPS base, then redeploy the frontend.

## Quick path (new VPS)

1. Create an Oracle Always Free Ampere Ubuntu VM ([DEPLOY-VPS.md](./DEPLOY-VPS.md)).
2. Install Docker, clone the repo, copy `.env.vps.example` → `.env`, set `JWT_SECRET`.
3. Run `./scripts/deploy-vps.sh`. For HTTPS: set `GATEWAY_DOMAIN` and use the `https` Compose profile.
4. On Vercel set `VITE_API_BASE_URL` to the public API base (HTTPS) and **Redeploy**.

## Google sign-in

1. [Google Cloud Console](https://console.cloud.google.com/) → OAuth client (Web).
2. Authorized JavaScript origins: `http://localhost:5173` and your Vercel URL.
3. Same Client ID in VPS `.env` (`GOOGLE_CLIENT_ID`) and Vercel (`VITE_GOOGLE_CLIENT_ID`).

## Seed demo accounts

```powershell
$env:GATEWAY_URL="https://129.146.96.27.sslip.io"
node scripts/demo/seed-cli.js
```

Then use the accounts in [DEMO.md](./DEMO.md).

## If something fails

| Symptom | Likely fix |
|---------|------------|
| Vercel UI loads, login fails | `VITE_API_BASE_URL` wrong or not redeployed; use HTTPS if the site is HTTPS |
| Curl to API times out | Security List / NSG missing 80, 443, or 8080 |
| Containers restart / OOM | Raise Ampere RAM (6–12 GB) |
| Google sign-in broken | Same Client ID on VPS + Vercel; JS origin = Vercel URL |
| JWT errors after recreate | Keep the same `JWT_SECRET` in `.env` across deploys |
