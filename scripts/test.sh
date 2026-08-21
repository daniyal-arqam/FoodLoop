#!/usr/bin/env bash
# Run FoodLoop frontend, backend, and Python tests.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

failed=0

run_suite() {
  local name="$1"
  shift
  log "Test: ${name}"
  if "$@"; then
    ok "${name}"
  else
    err "${name} failed"
    failed=$((failed + 1))
  fi
}

require_cmd node
require_cmd npm

[[ -d "$ROOT/frontend/node_modules" ]] || die "Frontend dependencies missing. Run ./scripts/setup.sh first."

log "Frontend tests"
run_suite "frontend (vitest)" npm test --prefix "$ROOT/frontend"

log "Backend tests"
run_suite "api-gateway" npm test --prefix "$ROOT/services/api-gateway"
run_suite "auth-service" npm test --prefix "$ROOT/services/auth-service"
run_suite "food-service" npm test --prefix "$ROOT/services/food-service"
run_suite "organization-service" npm test --prefix "$ROOT/services/organization-service"

log "Python tests"
MATCHER_PY="$(venv_python "$ROOT/python-services/matcher" || true)"
AI_PY="$(venv_python "$ROOT/ai-service" || true)"
[[ -n "$MATCHER_PY" ]] || die "Matcher venv missing. Run ./scripts/setup.sh first."
[[ -n "$AI_PY" ]] || die "AI venv missing. Run ./scripts/setup.sh first."

run_suite "matcher (pytest)" bash -c "cd \"$ROOT/python-services/matcher\" && \"$MATCHER_PY\" -m pytest"
run_suite "ai-service (pytest)" bash -c "cd \"$ROOT/ai-service\" && \"$AI_PY\" -m pytest"

log "Integration tests"
run_suite "e2e workflow" npm run test:e2e --prefix "$ROOT"

if [[ "$failed" -gt 0 ]]; then
  die "${failed} test suite(s) failed."
fi

ok "All requested test suites passed."
