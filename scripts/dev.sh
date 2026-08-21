#!/usr/bin/env bash
# Start the local FoodLoop development environment.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

MODE="${1:-local}"
PIDS=()

cleanup() {
  local pid
  if [[ "${#PIDS[@]}" -eq 0 ]]; then
    return 0
  fi
  log "Stopping background processes"
  for pid in "${PIDS[@]}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
}

trap cleanup EXIT INT TERM

start_bg() {
  local name="$1"
  shift
  log "Starting ${name}"
  "$@" &
  PIDS+=("$!")
}

start_python() {
  local name="$1"
  local dir="$2"
  local py="$3"
  local port="$4"
  log "Starting ${name}"
  (
    cd "$dir"
    "$py" -m uvicorn app.main:app --host 0.0.0.0 --port "$port"
  ) &
  PIDS+=("$!")
}

start_node_if_free() {
  local name="$1"
  local port="$2"
  local path="$3"
  if port_open 127.0.0.1 "$port"; then
    ok "${name} already listening on ${port}"
    return 0
  fi
  start_bg "$name" npm start --prefix "$path"
}

start_python_if_free() {
  local name="$1"
  local dir="$2"
  local py="$3"
  local port="$4"
  if port_open 127.0.0.1 "$port"; then
    ok "${name} already listening on ${port}"
    return 0
  fi
  start_python "$name" "$dir" "$py" "$port"
}

if [[ "$MODE" == "compose" || "$MODE" == "--compose" ]]; then
  docker_ok || die "Docker is not available. Install Docker Desktop (or an engine) and retry, or run: ./scripts/dev.sh"
  log "Starting Docker Compose (foreground). Ctrl+C stops the stack."
  docker_compose up --build
  exit 0
fi

if [[ "$MODE" != "local" && "$MODE" != "--local" ]]; then
  die "Unknown mode '${MODE}'. Use: ./scripts/dev.sh  or  ./scripts/dev.sh compose"
fi

[[ -d "$ROOT/frontend/node_modules" ]] || die "Dependencies missing. Run ./scripts/setup.sh first."
MATCHER_PY="$(venv_python "$ROOT/python-services/matcher")" \
  || die "Matcher venv missing. Run ./scripts/setup.sh first."
AI_PY="$(venv_python "$ROOT/ai-service")" \
  || die "AI venv missing. Run ./scripts/setup.sh first."

if docker_ok; then
  log "Ensuring MongoDB container is up"
  docker_compose up -d mongodb
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if port_open 127.0.0.1 27017; then
      break
    fi
    sleep 2
  done
fi

if ! port_open 127.0.0.1 27017; then
  log "Starting in-memory MongoDB on 27017 (Docker / local mongod not available)"
  start_bg "mongo-memory" node "$ROOT/scripts/demo/mongo-memory.js"
  for _ in $(seq 1 90); do
    if port_open 127.0.0.1 27017; then
      break
    fi
    sleep 1
  done
fi

MONGO_OK=0
if port_open 127.0.0.1 27017; then
  ok "MongoDB is reachable on 127.0.0.1:27017"
  MONGO_OK=1
else
  warn "MongoDB is not reachable on 127.0.0.1:27017."
  warn "Auth, food, and organization will not stay up until Mongo is running."
  warn "Start MongoDB locally, run ./scripts/start-mongo-memory.sh, or install Docker and run: docker compose up -d mongodb"
fi

start_node_if_free "api-gateway" 8080 "$ROOT/services/api-gateway"
if [[ "$MONGO_OK" -eq 1 ]]; then
  start_node_if_free "auth-service" 4001 "$ROOT/services/auth-service"
  start_node_if_free "food-service" 4002 "$ROOT/services/food-service"
  start_node_if_free "organization-service" 4003 "$ROOT/services/organization-service"
else
  warn "Skipping auth, food, and organization until MongoDB is available."
fi
start_python_if_free "matcher" "$ROOT/python-services/matcher" "$MATCHER_PY" 8001
start_python_if_free "ai-service" "$ROOT/ai-service" "$AI_PY" 8002
if port_open 127.0.0.1 5173; then
  ok "frontend already listening on 5173"
else
  start_bg "frontend" npm run dev --prefix "$ROOT/frontend"
fi

log "Waiting for listeners"
sleep 4
if [[ -f "$ROOT/scripts/health-check.sh" ]]; then
  bash "$ROOT/scripts/health-check.sh" || warn "Some health checks failed (expected if MongoDB is down)."
fi

cat <<'EOF'

FoodLoop local processes are running. Ctrl+C stops them.

  Frontend     http://localhost:5173
  API gateway  http://localhost:8080/health
  Matcher      http://localhost:8001/health
  AI           http://localhost:8002/health
EOF

if [[ -n "${FOODLOOP_DEV_TIMEOUT:-}" ]]; then
  log "FOODLOOP_DEV_TIMEOUT=${FOODLOOP_DEV_TIMEOUT}s (test mode); exiting so children are stopped."
  sleep "$FOODLOOP_DEV_TIMEOUT"
  exit 0
fi

if [[ "${#PIDS[@]}" -eq 0 ]]; then
  log "Nothing new to start; idling until Ctrl+C."
  while true; do
    sleep 3600
  done
fi

wait
