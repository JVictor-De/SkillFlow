# Makefile com atalhos para o stack SkillFlow.
# Funciona em Linux/macOS/WSL. No Windows nativo prefira PowerShell + scripts npm.

.PHONY: help up down logs migrate seed restart pytest frontend-test mobile-test \
        build-frontend build-backend deep-health

help:
	@echo "Targets disponíveis:"
	@echo "  make up                 # docker compose up --build -d"
	@echo "  make down               # docker compose down"
	@echo "  make logs               # docker compose logs -f --tail=200"
	@echo "  make migrate            # roda migrations dentro do container backend"
	@echo "  make seed               # popula o banco com seed_data"
	@echo "  make restart            # reinicia backend, worker e beat"
	@echo "  make pytest             # roda pytest no backend (host)"
	@echo "  make frontend-test      # npm test no frontend (host)"
	@echo "  make mobile-test        # flutter test no mobile (host)"
	@echo "  make deep-health        # GET /api/health/?deep=1 contra o backend rodando"

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

migrate:
	docker compose exec backend python manage.py migrate

seed:
	docker compose exec backend python manage.py seed_data --reset

restart:
	docker compose restart backend celery_worker celery_beat

pytest:
	cd backend && USE_SQLITE=1 CELERY_TASK_ALWAYS_EAGER=1 pytest -ra

frontend-test:
	cd frontend && npm test -- --silent && npm run lint

mobile-test:
	cd mobile && flutter analyze && flutter test

build-frontend:
	cd frontend && npm ci && npm run build

build-backend:
	docker build -t skillflow-backend ./backend

deep-health:
	curl -fsS http://localhost:8000/api/health/?deep=1 | python -m json.tool
