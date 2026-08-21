#!/usr/bin/env bash
# Seed deterministic FoodLoop hackathon demo users, orgs, and one Available listing.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_cmd node

export GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
export MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/foodloop}"

log "Seeding demo data via ${GATEWAY_URL}"

INDEX="$ROOT/ai-service/data/rag/index.faiss"
if [[ ! -f "$INDEX" ]]; then
  AI_PY="$(venv_python "$ROOT/ai-service" || true)"
  if [[ -n "$AI_PY" ]]; then
    log "Building RAG index for Food Safety demo"
    "$AI_PY" "$ROOT/ai-service/scripts/ingest.py"
  else
    warn "AI venv missing; Food Safety RAG needs ./scripts/setup.sh then ingest."
  fi
fi

node "$ROOT/scripts/demo/seed-cli.js"
ok "Demo seed finished. See docs/DEMO.md"
