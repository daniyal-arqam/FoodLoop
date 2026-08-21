#!/usr/bin/env bash
# Install local FoodLoop dependencies and check tooling.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

NODE_MIN_MAJOR=20
PYTHON_MIN="3.11"

log "FoodLoop setup"

# --- Node.js ---
require_cmd node
require_cmd npm
NODE_VERSION="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
if (( NODE_MAJOR < NODE_MIN_MAJOR )); then
  die "Node.js ${NODE_MIN_MAJOR}+ is required (found v${NODE_VERSION})."
fi
ok "Node.js v${NODE_VERSION}"
ok "npm $(npm -v)"

# --- Python ---
PY="$(python_cmd)"
if ! "$PY" -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)"; then
  die "Python ${PYTHON_MIN}+ is required."
fi
ok "Python $($PY --version 2>&1)"

# --- Docker (Compose images / optional Mongo) ---
DOCKER_READY=0
if have_cmd docker && docker_ok; then
  ok "Docker $(docker --version | head -n 1)"
  DOCKER_READY=1
elif have_cmd docker; then
  warn "Docker CLI is installed but the daemon is not reachable."
else
  warn "Docker is not installed. Local Node/Python setup can continue; Compose and image builds will be skipped."
fi

# --- MongoDB or Docker ---
if port_open 127.0.0.1 27017; then
  ok "MongoDB is reachable on 127.0.0.1:27017"
elif [[ "$DOCKER_READY" -eq 1 ]]; then
  ok "MongoDB is not on localhost:27017; Docker can run it (docker compose up -d mongodb)."
else
  warn "Neither local MongoDB (port 27017) nor Docker is available. Auth/food/organization need Mongo for local run. Unit tests use mongodb-memory-server."
fi

# --- Environment files (examples only; never write real secrets) ---
log "Environment files"
copy_env_if_missing "$ROOT/.env.example" "$ROOT/.env"
copy_env_if_missing "$ROOT/frontend/.env.example"
copy_env_if_missing "$ROOT/services/api-gateway/.env.example"
copy_env_if_missing "$ROOT/services/auth-service/.env.example"
copy_env_if_missing "$ROOT/services/food-service/.env.example"
copy_env_if_missing "$ROOT/services/organization-service/.env.example"
copy_env_if_missing "$ROOT/python-services/matcher/.env.example"
copy_env_if_missing "$ROOT/ai-service/.env.example"

# --- Node dependencies ---
log "Installing frontend dependencies"
npm install --prefix "$ROOT/frontend"

log "Installing Node service dependencies"
npm install --prefix "$ROOT/services/api-gateway"
npm install --prefix "$ROOT/services/auth-service"
npm install --prefix "$ROOT/services/food-service"
npm install --prefix "$ROOT/services/organization-service"

# --- Python dependencies ---
log "Installing Python dependencies (matcher)"
MATCHER_PY="$(ensure_venv "$ROOT/python-services/matcher")"
"$MATCHER_PY" -m pip install --upgrade pip
"$MATCHER_PY" -m pip install -r "$ROOT/python-services/matcher/requirements.txt"

log "Installing Python dependencies (ai-service)"
AI_PY="$(ensure_venv "$ROOT/ai-service")"
"$AI_PY" -m pip install --upgrade pip
"$AI_PY" -m pip install -r "$ROOT/ai-service/requirements.txt"

log "Building Food Safety RAG index"
"$AI_PY" "$ROOT/ai-service/scripts/ingest.py"

cat <<'EOF'

Setup complete.

Next steps:
  ./scripts/dev.sh          Start local processes (needs MongoDB or Docker for data services)
  ./scripts/dev.sh compose  Start Docker Compose (requires Docker)
  ./scripts/test.sh         Run frontend, backend, and Python tests
  ./scripts/build.sh        Build frontend, syntax-check backends, build images if Docker exists
  ./scripts/deploy.sh       Apply Kubernetes manifests (requires kubectl + a cluster)

Put real JWT/OpenAI values only in local .env files (gitignored). Do not commit secrets.
EOF
