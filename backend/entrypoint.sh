#!/usr/bin/env sh
set -e

# Wait for Postgres if configured. We do a few rounds of `pg_isready` style
# polling because Compose health checks already gate the dependency, but
# Coolify single-service deploys may not.
if [ "${USE_SQLITE:-false}" != "true" ] && [ -n "${POSTGRES_HOST:-}" ]; then
  echo "[entrypoint] waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT:-5432}..."
  i=0
  until python - <<'PY'
import os, sys, socket
host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
s = socket.socket()
s.settimeout(2)
try:
    s.connect((host, port))
except OSError as exc:
    print(f"connect failed: {exc}")
    sys.exit(1)
s.close()
PY
  do
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
      echo "[entrypoint] postgres still unreachable after 30 attempts, giving up"
      exit 1
    fi
    sleep 2
  done
  echo "[entrypoint] postgres is reachable"
fi

# Run migrations unless the operator explicitly skips them (e.g. in a worker
# container we can rely on the API container that already migrated the DB).
if [ "${SKILLFLOW_RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying migrations"
  python manage.py migrate --noinput
fi

# Optional: collect static at boot time. Already done at build time, but it's
# cheap to repeat and ensures consistency on volume mounts.
if [ "${SKILLFLOW_COLLECT_STATIC:-false}" = "true" ]; then
  echo "[entrypoint] collecting static files"
  python manage.py collectstatic --noinput
fi

# Optional one-shot seed for demo deploys.
if [ "${SKILLFLOW_SEED:-false}" = "true" ]; then
  echo "[entrypoint] seeding demo data"
  python manage.py seed_data --reset || true
fi

exec "$@"
