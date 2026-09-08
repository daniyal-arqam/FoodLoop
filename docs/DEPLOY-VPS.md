# Deploy backends on an always-on VPS

Recommended live stack for FoodLoop:

| Layer | Where | Cost |
|-------|--------|------|
| Frontend | **Vercel** | Free |
| APIs (gateway + auth + food + org + matcher + AI + Mongo) | **Oracle Cloud Always Free** Ampere VM (recommended) or Student Pack DigitalOcean / Azure | Free / student credits |
| Optional DB hosted | MongoDB Atlas M0 | Free (only if you skip Compose Mongo) |

A small always-on VM does not sleep between requests the way free PaaS web services often do.

Use the same Compose files on any Docker host:

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build
```

---

## A. Oracle Cloud Always Free (recommended)

Truly free + always on. Ampere is **ARM64**; official Node / Python / Mongo / Caddy images support it.

### 1. Create the VM

1. Sign up at [https://cloud.oracle.com](https://cloud.oracle.com) (Always Free).
2. **Compute → Instances → Create instance**.
3. Image: **Canonical Ubuntu 22.04** (or 24.04) — **aarch64**.
4. Shape: **VM.Standard.A1.Flex** (Ampere).
   - Start with **2 OCPU / 12 GB RAM** (or **1 OCPU / 6 GB** if capacity is limited).
5. Networking: use the default VCN. Assign a **public IP**.
6. Add your SSH public key. Create the instance. Note the public IP.

### 2. Open ports (VCN Security List / NSG)

Ingress (source `0.0.0.0/0` for a public demo):

| Port | Why |
|------|-----|
| `22` | SSH |
| `8080` | API gateway (HTTP) |
| `80` / `443` | Only if you use the HTTPS Caddy profile later |

Also allow egress (default usually OK).

### 3. Continue from § Install Docker below

SSH:

```bash
ssh ubuntu@YOUR_ORACLE_IP
# or: ssh opc@YOUR_ORACLE_IP
```

Then the same Docker install, clone, `.env`, and `./scripts/deploy-vps.sh` steps.

---

## B. GitHub Student Pack → DigitalOcean (alternative)

1. Open [https://education.github.com/pack](https://education.github.com/pack) and activate the pack.
2. Claim **DigitalOcean** credit.
3. **Create Droplet**: Ubuntu 24.04, **2 GB RAM**, nearest region, SSH key.
4. Note the droplet public IP. Continue from § Install Docker.

Azure for Students works the same way (Ubuntu VM + Docker).

---

## Install Docker on the VM

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
# log out and back in so docker works without sudo
docker run --rm hello-world
```

Firewall reminder: Oracle Security List **and** `ufw` (if enabled) must allow `22` and `8080`.

---

## Clone FoodLoop and configure

```bash
sudo mkdir -p /opt && sudo chown "$USER":"$USER" /opt
cd /opt
git clone https://github.com/daniyal-arqam/FoodLoop.git
cd FoodLoop
cp .env.vps.example .env
nano .env
```

Set at least:

```env
JWT_SECRET=paste-a-long-random-string
CORS_ORIGINS=*
GOOGLE_CLIENT_ID=your-google-web-client-id
```

Generate a secret:

```bash
openssl rand -hex 32
```

---

## Start the stack

```bash
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build
```

First build can take 10–20 minutes. Check:

```bash
curl http://127.0.0.1:8080/health
curl http://YOUR_VM_IP:8080/health
```

You want JSON with `"success": true`.

Internal services (auth, food, …) are **not** published on the public internet — only the gateway on `8080`.

---

## Point Vercel at the VM

Vercel → FoodLoop project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `http://YOUR_VM_IP:8080` (no trailing slash) |
| `VITE_GOOGLE_CLIENT_ID` | same Google client id as on the VPS |

**Redeploy** the frontend so Vite bakes the new API URL.

Google Cloud OAuth → Authorized JavaScript origins: your Vercel URL (and `http://localhost:5173` for local).

---

## Seed demo data

From your laptop:

```powershell
$env:GATEWAY_URL="http://YOUR_VM_IP:8080"
node scripts/demo/seed-cli.js
```

Default Compose uses Mongo **on the VM**, so gateway seed alone is enough for most demos.

---

## Optional HTTPS (domain)

1. Point a DNS **A record** (for example `api.yourdomain.com`) at the VM IP.
2. In `.env`: `GATEWAY_DOMAIN=api.yourdomain.com`
3. Start with the HTTPS profile:

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml --profile https up -d --build
```

4. Set Vercel `VITE_API_BASE_URL` to `https://api.yourdomain.com` and redeploy.
5. Open `80` / `443` in the Security List; you can close public `8080` if Caddy is the only entry.

---

## Updates after `git push`

On the VM:

```bash
cd /opt/FoodLoop
git pull
./scripts/deploy-vps.sh
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| VM OOM / containers restart | Raise Ampere RAM (6–12 GB) or use a 2 GB x86 droplet; `docker stats` |
| Vercel login fails | `VITE_API_BASE_URL` must be the VM gateway; redeploy frontend |
| Curl to `:8080` times out | Oracle Security List / NSG missing `8080`; check `ufw` |
| Google sign-in broken | Same `GOOGLE_CLIENT_ID` on VPS `.env` and Vercel; JS origin = Vercel URL |
| `JWT` errors after recreate | Keep the same `JWT_SECRET` in `.env` across deploys |
| Oracle “Out of capacity” for Ampere | Retry another region (e.g. Phoenix, Frankfurt) or smaller shape |

## Why a VPS

- No idle sleep between requests
- One `docker compose` matches local/dev
- Oracle Always Free can stay on without a paid worker
- Frontend stays on free Vercel
