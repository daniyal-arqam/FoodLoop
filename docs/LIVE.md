# Live deploy

FoodLoop’s public stack:

| Layer | Host | Cost |
|-------|------|------|
| Frontend | [Vercel](https://food-loop-theta.vercel.app) | Free |
| APIs + Mongo | Oracle Always Free Ampere VM (Docker Compose) | Free, always on |
| HTTPS | Caddy on the VM (`*.sslip.io` or your domain) | Free |

Full VM setup: [DEPLOY-VPS.md](./DEPLOY-VPS.md).

Do not commit filled `.env` files or database passwords.

## Live links (operators)

| Item | URL |
|------|-----|
| App | https://food-loop-theta.vercel.app |
| API health | Set after deploy (HTTPS gateway / Caddy). Do not commit raw IPs with secrets. |
| GitHub | https://github.com/daniyal-arqam/FoodLoop |

Prefer documenting the API base only in private notes or Vercel env. If you must publish a health URL, use your HTTPS hostname — never paste `JWT_SECRET`, Mongo URIs, or API keys into the README.

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
$env:GATEWAY_URL="https://YOUR_API_HOST"
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
