#!/usr/bin/env bash
set -euo pipefail

failed=0

check() {
  local name="$1"
  local url="$2"
  if curl -fsS "$url" | grep -q '"status": "ok"\|"status":"ok"'; then
    echo "PASS  $name  $url"
  else
    echo "FAIL  $name  $url"
    failed=$((failed + 1))
  fi
}

check api-gateway http://localhost:8080/health
check auth-service http://localhost:4001/health
check food-service http://localhost:4002/health
check organization-service http://localhost:4003/health
check matcher http://localhost:8001/health
check ai-service http://localhost:8002/health
check frontend http://localhost:5173/health.json

if [[ "$failed" -gt 0 ]]; then
  echo "$failed health check(s) failed."
  exit 1
fi

echo "All health checks passed."
