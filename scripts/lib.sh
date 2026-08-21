#!/usr/bin/env bash
# Shared helpers for FoodLoop scripts. Sourced, not executed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '==> %s\n' "$*"; }
ok() { printf 'OK    %s\n' "$*"; }
warn() { printf 'WARN  %s\n' "$*" >&2; }
err() { printf 'ERROR %s\n' "$*" >&2; }
die() { err "$*"; exit 1; }

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

require_cmd() {
  local name="$1"
  have_cmd "$name" || die "Required command not found: $name"
}

python_cmd() {
  if have_cmd python3; then
    printf '%s\n' "python3"
  elif have_cmd python; then
    printf '%s\n' "python"
  else
    die "Python 3.11+ is required but was not found."
  fi
}

venv_python() {
  local dir="$1"
  if [[ -x "$dir/.venv/bin/python" ]]; then
    printf '%s\n' "$dir/.venv/bin/python"
  elif [[ -f "$dir/.venv/Scripts/python.exe" ]]; then
    printf '%s\n' "$dir/.venv/Scripts/python.exe"
  else
    return 1
  fi
}

ensure_venv() {
  local dir="$1"
  local py
  py="$(python_cmd)"
  if ! venv_python "$dir" >/dev/null; then
    log "Creating virtualenv in $dir/.venv"
    "$py" -m venv "$dir/.venv"
  fi
  venv_python "$dir"
}

port_open() {
  local host="$1"
  local port="$2"
  local py
  py="$(python_cmd)"
  "$py" -c "import socket; s=socket.create_connection(('$host', int('$port')), 2); s.close()" >/dev/null 2>&1
}

docker_ok() {
  have_cmd docker && docker info >/dev/null 2>&1
}

docker_compose() {
  if docker_ok && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif have_cmd docker-compose; then
    docker-compose "$@"
  else
    return 1
  fi
}

copy_env_if_missing() {
  local example="$1"
  local dest="${2:-${example%.example}}"
  if [[ ! -f "$example" ]]; then
    return 0
  fi
  if [[ -f "$dest" ]]; then
    ok "Keeping existing ${dest#"$ROOT/"}"
    return 0
  fi
  cp "$example" "$dest"
  ok "Created ${dest#"$ROOT/"} from $(basename "$example")"
}
