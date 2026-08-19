# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        libmagic1 \
        libpq5 \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential libpq-dev

COPY . .

# Collect static at build time. With WhiteNoise + ManifestStaticFilesStorage the
# resulting bundle has hashed filenames ready to be served by gunicorn.
RUN python manage.py collectstatic --noinput || true

# Entrypoint runs migrations / wait-for-db before delegating to CMD.
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Healthcheck used by Coolify / docker-compose. The cheap variant is enough
# for liveness; deep checks (?deep=1) are reserved for monitoring dashboards.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
