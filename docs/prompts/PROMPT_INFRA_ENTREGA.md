# PROMPT DE IMPLEMENTAÇÃO — INFRA, MONOREPO E ENTREGA SKILLFLOW
# Docker Compose + Coolify + Ambientes + Logs + Setup + Demo

> Use este prompt quando quiser implementar ou revisar **a infraestrutura geral do monorepo** SkillFlow.
>
> Documentos obrigatórios de referência:
> 1. `TechSpecs.md` — arquitetura, serviços, banco, filas e contratos técnicos.
> 2. `PROMPT_IMPLEMENTACAO.md` — referência completa do projeto.
> 3. `PROMPT_API.md` — necessidades operacionais do backend/API.
> 4. `PROMPT_FRONTEND_MOBILE.md` — necessidades operacionais de Web e Mobile.
> 5. `PROMPT_REFINAMENTO.md` — checklist final de qualidade e entrega.
> 6. `PRD.md` — contexto de produto.
> 7. `desafio_software_engineer.md` — critérios da avaliação.
>
> Objetivo: garantir que o projeto rode de ponta a ponta com comandos claros, ambiente reprodutível, variáveis documentadas, logs úteis, entrega demonstrável e deploy preparado para Coolify.

---

## 1. Escopo

Implemente a infraestrutura local e os artefatos de entrega do SkillFlow:

- estrutura final do monorepo;
- `docker-compose.yml` completo;
- Dockerfile do backend;
- Dockerfile do frontend;
- configuração de PostgreSQL;
- configuração de Redis;
- Celery Worker;
- Celery Beat;
- volumes de banco e mídia;
- `.env.example` na raiz;
- `.env.example` para backend, frontend e mobile quando útil;
- comandos de setup;
- comandos de teste;
- logs estruturados básicos;
- healthchecks simples;
- configuração de deploy no Coolify;
- domínios públicos para Web e API;
- variáveis de produção no painel do Coolify;
- README com roteiro de execução;
- checklist de demo.

Este prompt não substitui os prompts de API, Frontend/Mobile ou Refinamento. Ele fecha a camada operacional para que tudo rode integrado.

---

## 2. Estrutura Final do Monorepo

```text
SkillFlow/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── services/
│   ├── tasks/
│   ├── tests/
│   ├── media/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
├── frontend/
│   ├── src/
│   ├── public/
│   ├── __tests__/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.js
├── mobile/
│   ├── lib/
│   ├── test/
│   ├── pubspec.yaml
│   └── .env.example
├── docs/
│   ├── demo-roteiro.md
│   └── coolify-deploy.md
├── .dockerignore
├── docker-compose.yml
├── .env.example
├── README.md
├── PRD.md
├── TechSpecs.md
├── DESIGN_GUIDELINES.md
├── PROMPT_IMPLEMENTACAO.md
├── PROMPT_API.md
├── PROMPT_FRONTEND_MOBILE.md
├── PROMPT_INFRA_ENTREGA.md
├── PROMPT_REFINAMENTO.md
├── ROADMAP.md
└── README.md
```

---

## 3. Docker Compose Obrigatório

Crie um `docker-compose.yml` na raiz com:

- `db`: PostgreSQL 16;
- `redis`: Redis 7;
- `backend`: Django API;
- `celery_worker`: worker assíncrono;
- `celery_beat`: agendador do Drip Content;
- `frontend`: Next.js;
- volumes persistentes para PostgreSQL e mídia.

Referência:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: skillflow_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-skillflow}
      POSTGRES_USER: ${POSTGRES_USER:-skillflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-skillflow_secret}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-skillflow} -d ${POSTGRES_DB:-skillflow}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: skillflow_redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: skillflow_backend
    command: python manage.py runserver 0.0.0.0:8000
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env
    volumes:
      - ./backend:/app
      - media_data:/app/media

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: skillflow_celery_worker
    command: celery -A config worker -l info
    depends_on:
      - backend
      - redis
      - db
    env_file:
      - .env
    volumes:
      - ./backend:/app
      - media_data:/app/media

  celery_beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: skillflow_celery_beat
    command: celery -A config beat -l info
    depends_on:
      - backend
      - redis
      - db
    env_file:
      - .env
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: skillflow_frontend
    command: npm run dev
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000}
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  media_data:
```

### 3.1. Compatibilidade com Coolify

O mesmo `docker-compose.yml` deve servir como base para deploy no Coolify, mas com atenção às diferenças entre ambiente local e produção:

- no Coolify, configure as variáveis no painel da aplicação, não em um `.env` commitado;
- mantenha `db` e `redis` sem domínio público;
- publique apenas `frontend` e `backend`;
- use volumes persistentes do Coolify para `postgres_data` e `media_data`;
- não use bind mounts como `./backend:/app` e `./frontend:/app` em produção, pois o container deve rodar a partir da imagem buildada;
- use `DEBUG=False`, `SECRET_KEY` forte, `ALLOWED_HOSTS` com o domínio da API e `CORS_ALLOWED_ORIGINS` com o domínio do frontend;
- `NEXT_PUBLIC_API_URL` deve apontar para o domínio público da API no Coolify;
- rode migrations como comando manual/one-off no painel do Coolify após o primeiro deploy;
- rode `seed_data` apenas em ambiente de demonstração, nunca em produção real com dados de clientes.

Se o Coolify não aceitar bem o mesmo Compose usado localmente por causa dos bind mounts, crie um arquivo adicional `docker-compose.coolify.yml` ou documente no `docs/coolify-deploy.md` quais volumes devem ser removidos no deploy.

### 3.2. Serviços no Coolify

Configure o projeto no Coolify como uma aplicação Docker Compose conectada ao repositório.

Serviços esperados:

```text
frontend       público   domínio: https://app.seu-dominio.com
backend        público   domínio: https://api.seu-dominio.com
db             interno   sem domínio público
redis          interno   sem domínio público
celery_worker  interno   sem domínio público
celery_beat    interno   sem domínio público
```

Regras:

- o frontend conversa com `https://api.seu-dominio.com`;
- o backend conversa internamente com `db:5432` e `redis:6379`;
- Celery Worker e Beat usam a mesma imagem do backend;
- PostgreSQL e Redis devem ficar isolados da internet;
- mídia enviada por usuários deve persistir em volume ou storage externo.

---

## 4. Dockerfile do Backend

Crie `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev poppler-utils tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

O backend deve ler configurações por variável de ambiente. Não hardcode secrets.

Para desenvolvimento local, o `docker-compose.yml` pode sobrescrever o comando para `python manage.py runserver 0.0.0.0:8000`. Para Coolify, prefira `gunicorn` e `DEBUG=False`.

---

## 5. Dockerfile do Frontend

Crie `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### 5.1. `.dockerignore` Obrigatório

Crie um arquivo `.dockerignore` na raiz de `backend/` e `frontend/` para evitar que lixo polua o container:

```text
node_modules/
__pycache__/
*.pyc
.env
.git/
media/
```

Para desenvolvimento local, o `docker-compose.yml` pode sobrescrever o comando para `npm run dev`. Para Coolify, use `npm run build` no Dockerfile e `npm run start` em produção.

---

## 6. Arquivo `.env.example`

Crie `.env.example` na raiz:

```env
# Django
SECRET_KEY=django-insecure-dev-key-change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
PUBLIC_API_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:3000

# Database
POSTGRES_DB=skillflow
POSTGRES_USER=skillflow
POSTGRES_PASSWORD=skillflow_secret
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgres://skillflow:skillflow_secret@db:5432/skillflow

# Redis / Celery
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

# Services ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
REDIS_PORT=6379

# Files
MEDIA_ROOT=/app/media
MAX_SUBMISSION_PDF_MB=10
MAX_MATERIAL_PDF_MB=50
MAX_BULK_ENROLLMENT_PDF_MB=10

# LLM
LLM_PROVIDER=mock
LLM_API_KEY=
LLM_MODEL=mock-model

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Mobile local development
MOBILE_API_URL_ANDROID=http://10.0.2.2:8000
MOBILE_API_URL_IOS=http://localhost:8000

# Firebase placeholder
FIREBASE_PROJECT_ID=
FCM_SERVER_KEY=

# Logging
LOG_LEVEL=INFO
```

Nunca commitar `.env` real. Commitar apenas `.env.example`.

### 6.1. Variáveis de Produção no Coolify

No Coolify, configure as variáveis diretamente no painel da aplicação. Exemplo:

```env
SECRET_KEY=valor-forte-gerado-fora-do-repositorio
DEBUG=False
ALLOWED_HOSTS=api.seu-dominio.com,backend
CSRF_TRUSTED_ORIGINS=https://app.seu-dominio.com,https://api.seu-dominio.com
CORS_ALLOWED_ORIGINS=https://app.seu-dominio.com
PUBLIC_API_URL=https://api.seu-dominio.com
PUBLIC_FRONTEND_URL=https://app.seu-dominio.com

POSTGRES_DB=skillflow
POSTGRES_USER=skillflow
POSTGRES_PASSWORD=senha-forte-do-coolify
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgres://skillflow:senha-forte-do-coolify@db:5432/skillflow

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

LLM_PROVIDER=mock
LLM_API_KEY=
LLM_MODEL=mock-model

NEXT_PUBLIC_API_URL=https://api.seu-dominio.com

LOG_LEVEL=INFO
```

Não exponha `POSTGRES_PORT` nem `REDIS_PORT` publicamente no Coolify, salvo necessidade excepcional de administração.

---

## 7. Variáveis por Camada

### Backend

- `SECRET_KEY`
- `DEBUG`
- `DATABASE_URL`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `MEDIA_ROOT`
- limites de upload
- `LOG_LEVEL`

### Frontend

- `NEXT_PUBLIC_API_URL`

### Mobile

Crie `mobile/.env.example` ou documente no README:

```env
API_URL_ANDROID=http://10.0.2.2:8000
API_URL_IOS=http://localhost:8000
API_URL_DEVICE=http://SEU_IP_LOCAL:8000
```

Documente que em dispositivo físico é necessário usar o IP local da máquina, não `localhost`.

Em builds apontando para Coolify, o app mobile deve usar o domínio público da API:

```env
API_URL_PRODUCTION=https://api.seu-dominio.com
```

O domínio deve estar com HTTPS válido, pois câmera, upload e integrações modernas do mobile podem falhar em ambientes inseguros.

---

## 8. Comandos de Setup

Documente no README:

```bash
cp .env.example .env
docker compose up --build
```

Em outro terminal:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

URLs esperadas:

```text
Landing/Web: http://localhost:3000
API: http://localhost:8000
Swagger/OpenAPI: http://localhost:8000/api/docs
PostgreSQL: localhost:5432
Redis: localhost:6379
```

### 8.1. Setup no Coolify

Documente no `docs/coolify-deploy.md`:

1. Criar um novo projeto no Coolify.
2. Conectar o repositório Git do SkillFlow.
3. Escolher deploy via Docker Compose.
4. Configurar os serviços `frontend`, `backend`, `db`, `redis`, `celery_worker` e `celery_beat`.
5. Atribuir domínio público ao `frontend`.
6. Atribuir domínio público ao `backend`.
7. Não atribuir domínio público a `db`, `redis`, `celery_worker` e `celery_beat`.
8. Criar volumes persistentes para PostgreSQL e mídia.
9. Cadastrar variáveis de produção no painel.
10. Fazer o primeiro deploy.
11. Rodar migrations pelo terminal/console do container backend:

```bash
python manage.py migrate
```

12. Rodar seed apenas se for ambiente demo:

```bash
python manage.py seed_data
```

13. Validar:

```text
https://app.seu-dominio.com
https://api.seu-dominio.com/api/health/
https://api.seu-dominio.com/api/docs
```

---

## 9. Comandos de Testes e Qualidade

Backend:

```bash
docker compose exec backend pytest
docker compose exec backend python manage.py check
```

Frontend:

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

Mobile:

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

Infra:

```bash
docker compose ps
docker compose logs backend
docker compose logs celery_worker
docker compose logs celery_beat
```

---

## 10. Logs e Observabilidade Básica

Implemente logs estruturados suficientes para avaliação local.

### Backend

Logar:

- login bem-sucedido e falho, sem senha;
- criação de aluno/professor/responsável;
- criação/publicação de atividade;
- upload aceito/rejeitado;
- submissão criada;
- task Celery iniciada/finalizada/falhou;
- correção IA mockada;
- conflito offline;
- override de nota;
- erro inesperado com stack trace em desenvolvimento.

Não logar:

- senha;
- refresh token;
- access token;
- conteúdo completo de PDF;
- chave de API;
- dados sensíveis desnecessários.

### Celery

Cada task deve logar:

- `task_name`;
- `task_id`;
- entidade processada;
- duração aproximada quando possível;
- status final.

### Frontend/Mobile

Registrar no console apenas erros úteis em desenvolvimento. Não expor tokens.

### Coolify

No Coolify, use os logs por serviço para diagnosticar:

- `backend`: erros HTTP, autenticação, CORS, uploads, migrations e conexão com banco;
- `frontend`: build Next.js, variáveis públicas e erros de renderização;
- `celery_worker`: execução de correção dissertativa, RAG e cadastro em massa;
- `celery_beat`: publicação automática de atividades agendadas;
- `db`: falhas de conexão, volume ou credenciais;
- `redis`: falhas de broker/fila.

Crie no README uma seção "Como debugar no Coolify" com a ordem recomendada:

1. verificar status dos serviços;
2. abrir logs do backend;
3. abrir logs do worker;
4. testar `/api/health/`;
5. validar variáveis de ambiente;
6. rodar migrations se necessário.

---

## 11. Healthchecks Simples

Implemente ou documente:

- `GET /api/health/` no backend retornando `{status: "ok"}`;
- healthcheck do PostgreSQL via `pg_isready`;
- healthcheck do Redis via `redis-cli ping`;
- orientação para verificar worker com logs.
- healthcheck público no Coolify apontando para `/api/health/` no serviço backend.

Exemplo:

```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok"
}
```

---

## 12. Dados de Seed e Credenciais

O seed deve imprimir credenciais no console e o README deve listar contas padrão, por exemplo:

```text
Coordenador: coordenador@skillflow.test / password123
Professor: professor@skillflow.test / password123
Aluno: aluno@skillflow.test / password123
Responsável: responsavel@skillflow.test / password123
```

Use senhas apenas para ambiente local. Não usar em produção.

---

## 13. README Obrigatório

Atualize `README.md` com:

- visão geral do SkillFlow;
- stack;
- arquitetura Mermaid;
- estrutura do monorepo;
- pré-requisitos;
- variáveis de ambiente;
- setup com Docker;
- migrations e seed;
- URLs locais;
- credenciais de teste;
- comandos de teste;
- comandos de logs;
- instruções de deploy no Coolify;
- domínios esperados de frontend e API;
- variáveis de produção no Coolify;
- como executar migrations no Coolify;
- troubleshooting;
- limitações conhecidas;
- roteiro de demo;
- decisões técnicas.

---

## 14. Troubleshooting

Inclua uma seção de problemas comuns:

- porta 5432 ocupada;
- porta 3000 ocupada;
- porta 8000 ocupada;
- migrations pendentes;
- container sem permissão em volume;
- Redis indisponível;
- Celery não processa fila;
- Flutter emulador Android não acessa `localhost`;
- upload falha por tamanho;
- token expirado;
- CORS bloqueando frontend.
- domínio do Coolify sem HTTPS válido;
- `NEXT_PUBLIC_API_URL` apontando para `localhost` em produção;
- migrations não executadas após deploy;
- volumes não persistentes no PostgreSQL ou mídia;
- `DEBUG=True` em produção;
- `ALLOWED_HOSTS` sem domínio da API.

---

## 15. Checklist de Deploy no Coolify

Antes de apresentar o projeto pelo Coolify:

- frontend tem domínio HTTPS público;
- backend tem domínio HTTPS público;
- `NEXT_PUBLIC_API_URL` aponta para o backend público;
- `ALLOWED_HOSTS` inclui domínio da API;
- `CORS_ALLOWED_ORIGINS` inclui domínio do frontend;
- `CSRF_TRUSTED_ORIGINS` inclui domínios HTTPS;
- `DEBUG=False`;
- `SECRET_KEY` forte configurada no painel;
- PostgreSQL não tem porta pública exposta;
- Redis não tem porta pública exposta;
- volumes persistentes configurados para banco e mídia;
- migrations executadas;
- seed executado apenas se ambiente demo;
- `/api/health/` retorna ok;
- `/api/docs` abre ou está protegido conforme decisão do projeto;
- Celery Worker processa uma task de teste;
- Celery Beat está ativo;
- logs não expõem secrets;
- README explica como atualizar variáveis e fazer redeploy.

---

## 16. CI/CD (Bônus)

Para implementar a integração contínua e deployment automático:
- Crie um workflow `.github/workflows/main.yml`.
- Configure jobs distintos:
  1. **Lint & Test Backend**: `pytest` e checagem de estilo (flake8/black).
  2. **Lint & Test Frontend**: `npm run lint` e `npm test`.
  3. **Test Mobile**: `flutter test`.
- Em produção, configure o Coolify Webhooks para disparar builds automaticamente quando a branch `main` for atualizada.

---

## 17. Checklist de Entrega

Antes de considerar a infra pronta:

- `docker compose up --build` sobe sem erro.
- `backend` responde em `http://localhost:8000`.
- `frontend` responde em `http://localhost:3000`.
- `db` está saudável.
- `redis` está saudável.
- `celery_worker` inicia e consome tasks.
- `celery_beat` inicia e agenda jobs.
- migrations rodam.
- seed roda.
- Swagger/OpenAPI abre.
- Landing Page abre.
- login docente funciona na Web.
- login aluno/responsável funciona no App ou via API.
- logs mostram eventos importantes.
- `.env.example` está completo.
- README permite que outra pessoa rode o projeto do zero.

---

## 18. Critérios de Pronto

A camada de infra/entrega está pronta quando:

- todos os serviços locais rodam com um único `docker compose up --build`;
- os serviços também estão documentados para Coolify;
- variáveis necessárias estão documentadas;
- comandos de setup são reproduzíveis;
- comandos de teste estão documentados;
- logs ajudam a diagnosticar backend, Celery e integração;
- não há secrets reais no repositório;
- README e roteiro de demo permitem apresentar o projeto com clareza;
- o fluxo principal pode ser demonstrado do zero após seed;
- o projeto pode ser acessado por URLs públicas HTTPS no Coolify.
