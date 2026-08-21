#!/usr/bin/env bash
# Start an in-memory MongoDB on 27017 when Docker / local mongod is unavailable.
set -euo pipefail

# shellcheck source=lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

require_cmd node

PORT="${MONGO_PORT:-27017}"
if port_open 127.0.0.1 "$PORT"; then
  ok "MongoDB already listening on 127.0.0.1:${PORT}"
  exit 0
fi

log "Starting in-memory MongoDB on 127.0.0.1:${PORT}"
exec node "$ROOT/scripts/demo/mongo-memory.js"
