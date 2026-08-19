# Guia de Deploy no Coolify — SkillFlow

Este documento é o **passo a passo prático** para você publicar o monorepo SkillFlow no Coolify com **Docker Compose**: API Django, Next.js, Celery, Postgres, Redis e **Flutter Web** (`mobile_web`).

Substitua `seu-dominio.com` pelos seus domínios reais. Exemplo já usado em produção: `app.skillflow.peladeiro.cloud`, `api.skillflow.peladeiro.cloud`, `mobile.skillflow.peladeiro.cloud`.

---

## 0. Checklist: em que ordem você faz as coisas

Faça nesta ordem no **primeiro deploy** (e revise na mesma ordem se algo falhar):

| # | O que você faz | Onde no Coolify |
|---|----------------|-----------------|
| 1 | Criar projeto e ambiente (ex.: Production) | **Projects** → **Add New Project** |
| 2 | Adicionar o repositório como **Docker Compose** | **Add New Resource** → Git → Build Pack **Docker Compose** |
| 3 | Colar **todas** as variáveis de ambiente (bloco da seção 2.3) | Stack / aplicação → **Environment Variables** |
| 4 | Ajustar **domínios** HTTPS em `frontend`, `backend` e `mobile_web` | Cada serviço → **Configuration** → **Domains** |
| 5 | Garantir **volumes** persistentes (Postgres + media) | **Storages** (ou equivalente) |
| 6 | Clicar em **Deploy** e acompanhar logs até healthchecks verdes | Barra superior **Deploy** |
| 7 | Validar URLs e CORS (seção 4) | Navegador + `curl` |

**Importante:** variáveis como `NEXT_PUBLIC_*`, `MOBILE_WEB_*`, `CORS_ALLOWED_ORIGINS` e `DJANGO_SECRET_KEY` precisam estar corretas **antes** de um build que você queira manter em produção. Se você mudar só depois do deploy, altere a variável e faça **Redeploy** do serviço afetado (às vezes “sem cache”) para o build/runtime refletir a mudança.

---

## 1. Pré-requisitos

1. **Coolify** acessível (URL do seu painel).
2. **Repositório** SkillFlow no GitHub/GitLab com acesso do Coolify (GitHub App ou deploy key).
3. **DNS** dos domínios apontando para o IP do servidor onde o Coolify roda (registros A ou CNAME conforme seu provedor).

---

## 2. Como fazer o deploy no Coolify

### 2.1 Criar o projeto (primeira vez)

1. Abra o painel do Coolify.
2. **Projects** → **Add New Project**.
3. Nome sugerido: `SkillFlow Production`; ambiente: **Production** (ou o que você usar).

### 2.2 Adicionar o recurso Docker Compose (primeira vez)

1. Dentro do projeto/ambiente → **Add New Resource**.
2. **Git Repository** → escolha o repositório SkillFlow e a branch (ex.: `main`).
3. **Build Pack** → **Docker Compose**.
4. Confirme que o arquivo na raiz é `docker-compose.yml`. O Coolify lista os serviços: `db`, `redis`, `backend`, `celery_worker`, `celery_beat`, `frontend`, `mobile_web`.

### 2.3 Variáveis de ambiente (você cola no Coolify)

Vá em **Environment Variables** (nível da stack ou da aplicação Compose). Cole e ajuste os valores. **Não** commite senhas no Git.

**Substitua** `seu-dominio.com` e as senhas de exemplo pelos seus valores reais.

```env
# === Configurações do Backend ===
DJANGO_SECRET_KEY=gere-uma-chave-forte-e-aleatoria-sem-espacos
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=api.seu-dominio.com
USE_SQLITE=false
# Flutter Web é uma origem distinta: SEMPRE listar mobile.seu-dominio.com em
# ambos para que login/refresh do app funcionem sem CORS/CSRF block.
CSRF_TRUSTED_ORIGINS=https://app.seu-dominio.com,https://mobile.seu-dominio.com,https://api.seu-dominio.com
CORS_ALLOWED_ORIGINS=https://app.seu-dominio.com,https://mobile.seu-dominio.com
CORS_ALLOW_ALL_ORIGINS=false
SECURE_SSL_REDIRECT=true

# === Banco de Dados (Postgres) ===
POSTGRES_DB=skillflow
POSTGRES_USER=skillflow
POSTGRES_PASSWORD=gere-uma-senha-forte-para-o-banco
POSTGRES_HOST=db
POSTGRES_PORT=5432

# === Redis e Celery ===
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# === Serviço de LLM (Correção por IA) ===
LLM_PROVIDER=mock         # Use 'openai' para produção real
LLM_API_KEY=sua-chave-aqui # Necessário se LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini      # Necessário se LLM_PROVIDER=openai

# === Logs e Seed ===
LOG_LEVEL=INFO
# Se quiser popular o banco com dados de demonstração no start:
SKILLFLOW_SEED=false

# === Configurações do Frontend (Next.js) ===
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
NEXT_PUBLIC_USE_MOCKS=false

# === Configurações do Flutter Web (mobile_web) ===
# Lidos como build args pelo docker-compose e repassados como --dart-define
# ao `flutter build web`. Mudanças aqui exigem rebuild.
MOBILE_WEB_API_BASE_URL=https://api.seu-dominio.com
MOBILE_WEB_USE_MOCKS=false
```

*Nota: `NEXT_PUBLIC_*` (Next.js) e `MOBILE_WEB_*` (Flutter Web) entram no **build** da imagem. Se você mudar esses valores depois, precisa disparar um novo **Deploy** (ou **Redeploy**) do `frontend` ou do `mobile_web` para recompilar.*

### 2.4 Domínios (você configura em cada serviço)

Em cada serviço listado pelo Compose → **Configuration** → **Domains**:

| Serviço | Domínio (exemplo) | Observação |
|---------|-------------------|------------|
| `frontend` | `https://app.seu-dominio.com` | Next.js, porta interna 3000 |
| `backend` | `https://api.seu-dominio.com` | Django/Gunicorn, porta interna 8000 |
| `mobile_web` | `https://mobile.seu-dominio.com` | nginx na porta **80** do container; o Coolify termina TLS no proxy |
| `db`, `redis`, `celery_worker`, `celery_beat` | *(nenhum)* | Só rede interna; **não** publique domínio público |

### 2.5 O que é o `mobile_web` (Flutter Web)

É o app Flutter compilado para Web e servido por nginx (`mobile/Dockerfile.web`):

1. **Build:** imagem `ghcr.io/cirruslabs/flutter:3.24.0` → `flutter pub get` → se não existir pasta `web/`, gera com `flutter create --platforms=web .` → `flutter build web --release` com `--dart-define=API_BASE_URL=...` e `--dart-define=USE_MOCKS=...`.
2. **Runtime:** `nginx:1.27-alpine` serve `build/web/` com fallback SPA e rota `/healthz` para healthcheck.
3. **CORS:** a origem `https://mobile.seu-dominio.com` tem de aparecer em `CORS_ALLOWED_ORIGINS` no backend, senão login e refresh falham no navegador.

### 2.6 Volumes persistentes (Storages)

Na aba **Storages** (ou **Persistent Volumes**), configure para não perder dados a cada deploy:

1. **PostgreSQL** — volume `postgres_data` → caminho no container `/var/lib/postgresql/data` → serviço `db`.
2. **Mídia (uploads)** — volume `media_data` → `/app/media` → serviços `backend` e `celery_worker`.

### 2.7 Clicar em Deploy

1. Botão **Deploy** (canto superior direito da stack).
2. Acompanhe os logs de **cada** serviço até o build terminar. O Coolify pode construir `frontend`, `backend`, `mobile_web`, etc. em paralelo conforme a UI.
3. Confira healthchecks verdes em `backend`, `frontend`, `mobile_web`, `db`, `redis`, workers.

### 2.8 Depois do primeiro deploy: o que você redeploya quando mudar algo

| Você mudou… | O que fazer no Coolify |
|-------------|------------------------|
| Código no repositório (push na branch deployada) | **Deploy** na stack (ou redeploy por serviço, conforme o Coolify atualizar) |
| `NEXT_PUBLIC_API_URL` ou `NEXT_PUBLIC_USE_MOCKS` | **Redeploy** do serviço `frontend` (rebuild obrigatório) |
| `MOBILE_WEB_API_BASE_URL` ou `MOBILE_WEB_USE_MOCKS` | **Redeploy** do `mobile_web` (rebuild obrigatório) |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, secrets Django, DB | **Redeploy** do `backend` (e, se aplicável, `celery_worker` / `celery_beat` para pegarem as mesmas envs) |
| Só `docker-compose.yml` ou Dockerfiles | **Deploy** completo ou rebuild dos serviços afetados |

Se o Coolify oferecer **Redeploy without cache**, use quando suspeitar de build antigo (ex.: bundle ainda com URL errada da API).

---

## 3. Depois que o deploy subiu (o que você faz na sequência)

O backend roda `entrypoint.sh`, que aplica **migrations** na subida. Nos serviços `celery_worker` e `celery_beat` o compose já define `SKILLFLOW_RUN_MIGRATIONS=false` para não duplicar migrações.

### Popular dados ou criar admin (opcional)

Se você deixou `SKILLFLOW_SEED=false` e quer dados de demo ou um superusuário:

1. No Coolify, abra o serviço **`backend`** → **Terminal**.
2. Dados de demonstração:
   ```bash
   python manage.py seed_data --reset
   ```
3. Só superusuário Django:
   ```bash
   python manage.py createsuperuser
   ```

---

## 4. Como validar que o deploy deu certo

### 4.1 No navegador (smoke test)

Abra cada URL (troque pelo seu domínio):

- **Web (Next.js):** `https://app.seu-dominio.com`
- **API saudável:** `https://api.seu-dominio.com/api/health/` → corpo esperado: `{"status": "ok"}`
- **API + DB/Redis:** `https://api.seu-dominio.com/api/health/?deep=1`
- **Swagger:** `https://api.seu-dominio.com/api/docs`
- **Flutter Web:** `https://mobile.seu-dominio.com`

No Coolify, abra **Logs** de `celery_worker` e `celery_beat` e confira que não há stack trace em loop.

### 4.2 No terminal (`curl`)

Use os domínios reais. Abaixo estão os de **SkillFlow em produção**; adapte se os seus forem outros.

```bash
# 1) API responde e está saudável
curl -fsS https://api.skillflow.peladeiro.cloud/api/health/
curl -fsS "https://api.skillflow.peladeiro.cloud/api/health/?deep=1"

# 2) Flutter Web está servindo o index e nginx ok
curl -I https://mobile.skillflow.peladeiro.cloud/
curl -fsS https://mobile.skillflow.peladeiro.cloud/healthz

# 3) main.dart.js foi gerado e está sendo entregue (verifica build)
curl -I https://mobile.skillflow.peladeiro.cloud/main.dart.js

# 4) URL da API está EFETIVAMENTE bakeada no bundle (deve aparecer
#    no main.dart.js — se aparecer "10.0.2.2" você esqueceu o build arg).
curl -s https://mobile.skillflow.peladeiro.cloud/main.dart.js \
  | grep -o "https://api.skillflow.peladeiro.cloud" | head -1

# 5) CORS preflight do Flutter Web para a API (não pode dar erro nem 403)
curl -i -X OPTIONS https://api.skillflow.peladeiro.cloud/api/auth/login/ \
  -H "Origin: https://mobile.skillflow.peladeiro.cloud" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
# Esperado: HTTP/1.1 200 OK + header
#   Access-Control-Allow-Origin: https://mobile.skillflow.peladeiro.cloud
```

No Coolify, em cada serviço você pode também conferir o estado do healthcheck:

- `mobile_web` → aba **Health** → status `healthy` (test = `wget -q --spider /healthz`).
- `backend`   → aba **Health** → status `healthy` (test = `/api/health/`).

### 4.3 Na sua máquina (antes de confiar só no Coolify)

Se você tem Docker instalado na pasta do repositório:

```bash
# build isolado do Flutter Web apontando para a API de produção
docker compose build mobile_web

# sobe SOMENTE o mobile_web (depende apenas do nginx, sem db/redis)
docker compose up -d mobile_web

# checa o healthcheck e o conteúdo
docker compose ps mobile_web
curl -fsS http://localhost:8082/healthz
curl -I    http://localhost:8082/
```

---

## 5. Se algo der errado (troubleshooting)

- **Frontend chamando `localhost:8000` em produção?**
  A variável `NEXT_PUBLIC_API_URL` não estava definida corretamente no instante que você apertou *Deploy*. Como o Next.js insere isso no tempo de build, corrija o valor em *Environment Variables* e clique em *Deploy* novamente para forçar o rebuild.

- **Conflito de CORS (Erro no navegador ao logar ou buscar dados)?**
  O backend recusou a requisição. Certifique-se de que `CORS_ALLOWED_ORIGINS` contém **todas** as origens do navegador, sem barra no final, ex.: `https://app.seu-dominio.com,https://mobile.seu-dominio.com`. O Flutter Web é uma origem distinta do Next.js.

- **Erro de CSRF / Cookie ao enviar formulários/login?**
  Configure `CSRF_TRUSTED_ORIGINS=https://app.seu-dominio.com,https://mobile.seu-dominio.com,https://api.seu-dominio.com`.

- **Atividades continuam como "Agendadas" e nunca são publicadas?**
  Verifique os logs do serviço interno `celery_beat`. É ele quem dispara a rotina uma vez por minuto para verificar e atualizar o status das atividades.

- **Erro de permissão no volume de media ou banco vazando dados após deploy?**
  Você esqueceu de mapear os volumes persistentes (`postgres_data` e `media_data`) na aba *Storages*. Crie os volumes virtuais no Coolify apontando para os diretórios correspondentes.

- **App Mobile de Produção não consegue logar?**
  Lembre-se de compilar o aplicativo móvel no Flutter passando seu domínio público da API como `API_BASE_URL`.
  ```bash
  flutter build apk --dart-define=API_BASE_URL=https://api.seu-dominio.com
  ```

- **Flutter Web abre, mas não conecta na API?**
  Os valores `API_BASE_URL` e `USE_MOCKS` são bakeados em **build time**. Verifique:
  1. `MOBILE_WEB_API_BASE_URL` e `MOBILE_WEB_USE_MOCKS` no painel do Coolify apontam para o domínio público correto.
  2. No DevTools do navegador (aba *Network*), as requisições saem para `https://api.seu-dominio.com` — **não** para `http://10.0.2.2:8000` ou `http://localhost`. Se ainda aparecer o default, o serviço subiu com uma imagem antiga: clique em *Redeploy* (sem cache) no `mobile_web`.
  3. `curl -s https://mobile.seu-dominio.com/main.dart.js | grep -o "https://api.seu-dominio.com"` deve retornar pelo menos uma ocorrência. Se não retornar, o build args não chegou no `flutter build web` — confira `docker-compose.yml` (`build.args.API_BASE_URL`).

- **Build do `mobile_web` falha com `dart:io` / `sqflite` / etc.?**
  O app foi originalmente escrito para Android/iOS. Para o build web compilar você precisa que os imports `dart:io`, `sqflite` e plugins exclusivos de mobile (ex.: `firebase_messaging`, `image_picker` com câmera) sejam usados atrás de `if (kIsWeb)` ou substituídos por equivalentes web (`sqflite_common_ffi_web`, `package:web` etc.). Essa adequação é tratada como tarefa do app — a infra de deploy aqui descrita já cobre o pipeline desde que o `flutter build web` rode com sucesso na máquina local.

- **Página em branco no `mobile.seu-dominio.com` após deploy?**
  Browser cacheou um `flutter_service_worker.js` antigo. O `nginx.conf` já envia `Cache-Control: no-store` para o service worker e o `index.html`, mas usuários que visitaram a versão anterior precisam de um *hard reload* (Ctrl+F5) uma vez para aplicar. Confirme no DevTools (Application → Service Workers) que está rodando o SW da nova versão.

- **Healthcheck do `mobile_web` em `unhealthy`?**
  O comando do healthcheck é `wget -q --spider /healthz`. Verifique se o nginx subiu (`docker compose logs mobile_web`) e se o location `/healthz` está no `nginx.conf` — sem ele o healthcheck retornaria 404 e o Coolify reiniciaria o container em loop.

---

## 6. Rollback: o que você faz para voltar atrás

Use quando um deploy novo quebrou algo e você precisa voltar à versão anterior **sem** mexer no banco à mão.

### 6.1 Rollback de qualquer serviço (Frontend, Backend ou `mobile_web`)

No Coolify, abra a stack / aplicação e:

1. Aba **Deployments** → localize o último deploy verde (`Successful`) anterior ao quebrado.
2. Clique no menu (`...`) → **Redeploy this version**.
3. Coolify reusa a imagem armazenada do build anterior; nenhum rebuild é feito, então o rollback é praticamente instantâneo.

### 6.2 Rollback apenas do Flutter Web (`mobile_web`)
Quando só o `mobile_web` está quebrado e os outros serviços estão saudáveis:

```bash
# 1) Reverter o commit que mexeu no Dockerfile/Compose (no seu repositório local)
git revert <hash-do-commit-quebrado>
git push origin main

# 2) No Coolify, abrir somente o serviço mobile_web e clicar em "Restart"
#    (ou "Redeploy" para forçar o build da versão revertida).
```

Como `mobile_web` é um serviço estático isolado (sem volumes persistentes, sem migrações), o rollback é seguro: nenhum dado de aluno/professor é tocado.

### 6.3 Plano B — desabilitar Flutter Web sem afetar o resto
Se precisar tirar o Flutter Web do ar mantendo `frontend`/`backend` rodando:

1. No Coolify, em `mobile_web` → **Stop**.
2. Remova o domínio `https://mobile.seu-dominio.com` da aba *Domains* do serviço (evita o proxy responder com 502).
3. Os outros serviços continuam intactos — o Compose já garante que `mobile_web` não é dependência de ninguém (`depends_on` está vazio).

### 6.4 Verificação pós-rollback

Após qualquer rollback, repita os comandos da **seção 4.2** (validação com `curl`) para garantir que a versão antiga voltou e que CORS continua liberando o domínio mobile.
