# SkillFlow — Backend (Django + Django Ninja + Celery)

API REST que implementa o backend da plataforma SkillFlow conforme `PRD.md`,
`TechSpecs.md` e `PROMPT_API.md`. Cobre auto-cadastro público de escola,
JWT (access + refresh + blacklist), permissões por role, atividades,
submissões síncronas (MC) e assíncronas (dissertativa), chat tutor,
analytics e relatórios de cadastro em massa via PDF/IA mockáveis.

## Stack

- Python 3.12+
- Django 5.1
- Django Ninja 1.x + django-ninja-jwt
- PostgreSQL 16 (SQLite fallback para testes)
- Redis 7 + Celery 5 + Celery Beat (`django-celery-beat`)
- pytest + pytest-django

## Setup local — sem Docker

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # PowerShell
pip install -r requirements.txt
copy .env.example .env          # ajuste se necessário

# Para uso com Postgres local:
python manage.py migrate
python manage.py seed_data --reset
python manage.py runserver

# Em outro terminal — worker e beat:
celery -A config worker --loglevel=INFO
celery -A config beat --loglevel=INFO
```

Para rodar com SQLite (dev rápido / sem Postgres instalado):

```bash
$env:USE_SQLITE = "1"; python manage.py migrate
$env:USE_SQLITE = "1"; python manage.py seed_data --reset
$env:USE_SQLITE = "1"; python manage.py runserver
```

## Setup com Docker Compose

```bash
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data --reset
```

A API ficará em `http://localhost:8000`. O Swagger gerado pelo Django
Ninja está em `http://localhost:8000/api/docs`.

## Variáveis de ambiente

Ver `backend/.env.example`. Pontos críticos:

| Variável | Descrição |
|----------|-----------|
| `DJANGO_SECRET_KEY` | obrigatório em prod |
| `USE_SQLITE` | `1` para SQLite (apenas dev/testes) |
| `POSTGRES_*` | conexão Postgres |
| `REDIS_URL` / `CELERY_BROKER_URL` | broker |
| `CELERY_TASK_ALWAYS_EAGER` | rodar tasks síncronas (testes) |
| `LLM_PROVIDER` | `mock` (default) ou implementação futura |
| `JWT_ACCESS_TTL_MIN` / `JWT_REFRESH_TTL_DAYS` | TTL do JWT |

## Comandos úteis

```bash
# Migrations
python manage.py makemigrations
python manage.py migrate

# Seed de demonstração (ver credenciais ao final)
python manage.py seed_data --reset

# Executar todos os testes
pytest -ra

# Subset (mais rápido)
pytest tests/test_auth.py
```

## Credenciais geradas pelo seed

Senha em comum: `skillflow123`

| Email | Role | Escopo |
|-------|------|--------|
| `coord1@skillflow.dev` | Coordenador | Colégio Horizonte |
| `coord2@skillflow.dev` | Coordenador | Escola Inovação |
| `prof1@skillflow.dev` | Professor | Turmas 1A, 1B |
| `prof2@skillflow.dev` | Professor | Turmas 1A, 2A |
| `prof3@skillflow.dev` | Professor | Turmas 2A, 2B |
| `aluno1@skillflow.dev` | Aluno | Turma 1A |
| `resp1@skillflow.dev` | Responsável | Filhos: aluno1, aluno2 |

## Endpoints principais

A documentação interativa fica em `/api/docs`. Os caminhos seguem a
convenção `/api/auth/...`, `/api/saas/...`, `/api/app/...` e
`/api/app/responsavel/...` conforme `TechSpecs.md` §6.

## Deploy no Coolify

1. Aponte o repositório para o Coolify, modo "Docker Compose".
2. Apenas `backend` recebe domínio público (`api.seu-dominio.com`).
3. Configure variáveis: `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY` forte,
   `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`.
4. Após o primeiro deploy, rode manualmente:
   ```bash
   docker exec -it <container> python manage.py migrate
   ```
5. Healthcheck público: `GET /api/health/`.

## Decisões técnicas

- **Celery vs Temporal:** optamos por Celery por ter integração nativa
  com Django/Redis, suporte a Beat (Drip Content) e simplicidade no setup.
- **MockLLMService padrão:** o backend nunca depende de um provedor
  externo em dev/teste. Em produção basta trocar `LLM_PROVIDER`.
- **Schema PostgreSQL:** o ORM é fonte de verdade. Constraints físicas
  como `(EXERCICIO peso=1) ∨ (PROVA peso>=1)` vivem em `models.py` via
  `CheckConstraint`, garantindo paridade com o DDL de TechSpecs §5.1.
- **Validação de PDF:** assinatura de arquivo, contagem de páginas e
  limite de bytes feitos no `services.pdf_service`. PDFs malformados
  nunca quebram o worker.
- **Multi-tenant por escola:** todas as queries de coordenador filtram
  por `escola_id` do usuário; professor é restrito por `ProfessorTurma`.
