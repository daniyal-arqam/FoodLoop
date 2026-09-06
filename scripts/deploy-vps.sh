#!/usr/bin/env bash
# Run on the VPS from the FoodLoop repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.vps.example to .env and fill JWT_SECRET."
  exit 1
fi

echo "Building and starting FoodLoop (VPS profile)…"
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build

echo
echo "Gateway health:"
curl -fsS "http://127.0.0.1:${GATEWAY_PORT:-8080}/health" || true
echo
echo "Public URL: http://$(curl -fsS ifconfig.me 2>/dev/null || echo YOUR_DROPLET_IP):${GATEWAY_PORT:-8080}/health"
