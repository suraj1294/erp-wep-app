#!/bin/sh
set -eu

BOOTSTRAP_MODE="${DB_BOOTSTRAP_MODE:-clean}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-tally_erp}"
POSTGRES_USER="${POSTGRES_USER:-user}"

echo "[entrypoint] Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 2
done

case "$BOOTSTRAP_MODE" in
  clean)
    echo "[entrypoint] Applying database schema for a clean database"
    pnpm --filter @workspace/db db:push
    ;;
  schema)
    echo "[entrypoint] Applying database schema"
    pnpm --filter @workspace/db db:push
    ;;
  seeded)
    echo "[entrypoint] Applying database schema"
    pnpm --filter @workspace/db db:push
    echo "[entrypoint] Seeding demo data"
    pnpm --filter web exec tsx scripts/docker-seed.ts
    ;;
  *)
    echo "[entrypoint] Unsupported DB_BOOTSTRAP_MODE: $BOOTSTRAP_MODE" >&2
    exit 1
    ;;
esac

echo "[entrypoint] Starting web app"
exec "$@"
