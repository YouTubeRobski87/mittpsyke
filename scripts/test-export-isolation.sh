#!/usr/bin/env bash
# Kör dataexportens integrationstest mot en tillfällig, lokal PostgreSQL som
# skapas och tas bort av skriptet. Rör ingen annan databas.
# Kräver initdb, pg_ctl och psql (PostgreSQL 15 eller senare).
set -euo pipefail

PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb 2>/dev/null || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
WORK="$(mktemp -d)"
PORT="${EXPORT_IT_PORT:-55439}"
RUN_AS=()
# initdb vägrar köra som root
if [ "$(id -u)" = "0" ]; then
  chown postgres "$WORK"
  RUN_AS=(su postgres -c)
fi

run() {
  if [ ${#RUN_AS[@]} -gt 0 ]; then "${RUN_AS[@]}" "$*"; else bash -c "$*"; fi
}

cleanup() {
  run "$PG_BIN/pg_ctl -D $WORK/data -m immediate stop" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

run "$PG_BIN/initdb -D $WORK/data -A trust -U postgres" >/dev/null
run "$PG_BIN/pg_ctl -D $WORK/data -o '-p $PORT -k $WORK -c listen_addresses=' -l $WORK/log -w start" >/dev/null
psql -h "$WORK" -p "$PORT" -U postgres -X -q -c 'create database export_it'

EXPORT_IT_DATABASE_URL="postgresql://postgres@localhost/export_it?host=$WORK&port=$PORT" \
  npx vitest run tests/integration/export "$@"
