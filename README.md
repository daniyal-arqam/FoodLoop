# FoodLoop

I built FoodLoop for LoopLearn Hackathon 2026 (PS-04): leftover food from kitchens should reach nearby community organizations the same day, not sit in a chat thread until it expires.

Providers list surplus food. An admin verifies organizations. Those orgs browse listings, see a Python match score, claim a pickup, and mark it collected. The AI pages (waste advice, food-safety Q&A, matching help) call the same live APIs — they are not a mocked chatbot.

**Author:** Daniyal Arqam

Demo walkthrough: [docs/DEMO.md](docs/DEMO.md).

## Architecture

| Component | Stack | Default port | Health |
|-----------|--------|--------------|--------|
| Frontend | React (Vite) | 5173 | `GET /health.json` |
| API Gateway | Node.js + Express | 8080 | `GET /health` |
| Auth Service | Node.js + Express | 4001 | `GET /health` |
| Food Service | Node.js + Express | 4002 | `GET /health` |
| Organization Service | Node.js + Express | 4003 | `GET /health` |
| Matcher | Python FastAPI | 8001 | `GET /health` |
| AI Service | Python FastAPI | 8002 | `GET /health` |
| MongoDB | MongoDB | 27017 | — |

## Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB (later phases)
- Docker + Docker Compose (optional; used for containerized runs)

## Quick start (local, no Docker)

Copy environment defaults:

```bash
cp .env.example .env
```

Install Node dependencies:

```bash
npm install --prefix services/api-gateway
npm install --prefix services/auth-service
npm install --prefix services/food-service
npm install --prefix services/organization-service
npm install --prefix frontend
```

Create Python virtualenvs and install:

```bash
python -m venv python-services/matcher/.venv
python-services/matcher/.venv/Scripts/pip install -r python-services/matcher/requirements.txt

python -m venv ai-service/.venv
ai-service/.venv/Scripts/pip install -r ai-service/requirements.txt
```

On macOS/Linux, use `python-services/matcher/.venv/bin/pip` and `ai-service/.venv/bin/pip`.

Start each service from its directory (`npm start` or `uvicorn`), or use the automation scripts:

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/dev.sh
```

`./scripts/test.sh` runs frontend, backend, and Python tests. `./scripts/build.sh` builds the frontend (and Docker images when Docker is available). `./scripts/deploy.sh` applies Kubernetes manifests.

On Windows PowerShell you can still use `.\scripts\start-local.ps1`. Git Bash can run the `.sh` scripts directly.

Verify health:

```bash
# Windows
.\scripts\health-check.ps1

# macOS / Linux
./scripts/health-check.sh
```

## Docker Compose

Requires Docker. From the repository root:

```bash
docker compose build
docker compose up
```

Health endpoints (also used by Compose healthchecks):

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173/health.json` |
| API Gateway | `http://localhost:8080/health` |
| Auth | `http://localhost:4001/health` |
| Food | `http://localhost:4002/health` |
| Organizations | `http://localhost:4003/health` |
| Matcher | `http://localhost:8001/health` |
| AI | `http://localhost:8002/health` |

Set `JWT_SECRET` in `.env` (do not put secrets in Dockerfiles). `OPENAI_API_KEY` is optional; the AI health endpoint works without it.

## Kubernetes

Manifests live in [infrastructure/kubernetes](infrastructure/kubernetes/README.md).

```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/secrets.example.yaml
kubectl apply -f infrastructure/kubernetes/
kubectl get pods -n foodloop
kubectl get services -n foodloop
kubectl logs -n foodloop deploy/api-gateway
```

## Terraform

Cluster environment (namespace, ConfigMap, Secret, MongoDB PVC, quota) is in [infrastructure/terraform](infrastructure/terraform/README.md). It targets an existing kubeconfig; it does not create a cloud account.

```bash
cd infrastructure/terraform
terraform init
terraform fmt
terraform validate
# terraform plan / apply only when a real cluster is available
```

## Repository layout

See [docs/architecture.md](docs/architecture.md). Diagrams, API notes, and a short write-up live in `docs/`.

## Hackathon demo

With the stack running (`./scripts/dev.sh`):

```bash
./scripts/seed-demo.sh
```

Open http://localhost:5173 and follow [docs/DEMO.md](docs/DEMO.md) for the seeded demo accounts.

