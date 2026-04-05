#!/bin/sh
set -eu

MODE="${1:-clean}"

case "$MODE" in
  clean|schema|seeded) ;;
  *)
    echo "Usage: $0 [clean|schema|seeded]" >&2
    exit 1
    ;;
esac

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)

cd "$ROOT_DIR"

echo "[docker] Resetting existing containers and volumes"
docker compose down -v --remove-orphans

echo "[docker] Starting stack in $MODE mode"
DB_BOOTSTRAP_MODE="$MODE" docker compose up --build -d
