#!/usr/bin/env bash
# Build FoodLoop frontend, check Node services, and build Docker images when possible.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_cmd node
require_cmd npm

[[ -d "$ROOT/frontend/node_modules" ]] || die "Dependencies missing. Run ./scripts/setup.sh first."

log "Building frontend"
npm run build --prefix "$ROOT/frontend"
ok "Frontend build -> frontend/dist"

log "Backend services (Node.js, no transpile step)"
NODE_SERVERS=(
  services/api-gateway/src/server.js
  services/auth-service/src/server.js
  services/food-service/src/server.js
  services/organization-service/src/server.js
)
for file in "${NODE_SERVERS[@]}"; do
  node --check "$ROOT/$file"
  ok "syntax $file"
done

MATCHER_PY="$(venv_python "$ROOT/python-services/matcher" || true)"
AI_PY="$(venv_python "$ROOT/ai-service" || true)"
if [[ -n "$MATCHER_PY" ]]; then
  "$MATCHER_PY" -m compileall -q "$ROOT/python-services/matcher/app"
  ok "matcher Python compile"
else
  warn "Matcher venv missing; skip Python compile. Run ./scripts/setup.sh"
fi
if [[ -n "$AI_PY" ]]; then
  "$AI_PY" -m compileall -q "$ROOT/ai-service/app"
  ok "ai-service Python compile"
else
  warn "AI venv missing; skip Python compile. Run ./scripts/setup.sh"
fi

log "Docker images"
if docker_ok; then
  docker_compose build
  ok "docker compose build"
else
  warn "Docker is not available. Skipping image build."
  warn "Install Docker, then re-run ./scripts/build.sh or: docker compose build"
fi

ok "Build finished."
