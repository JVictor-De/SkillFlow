# Prompt: QA Engineer Sênior + Arquiteto Full Stack + Engenheiro de Integração
## SkillFlow — Auditoria Completa de Integração e Prontidão para Produção

---

## Contexto do Projeto

- **Nome:** SkillFlow
- **Descrição:** Plataforma SaaS de educação com IA para resolução de exercícios com correção automática (Ensino Médio)
- **Stack Backend:** Django 5.1 + Django Ninja + Celery 5 + Redis 7 + PostgreSQL 16 (SQLite em testes)
- **Stack Frontend Web:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Stack Mobile:** Flutter (Alunos e Responsáveis, offline-first)
- **Banco de Dados:** PostgreSQL 16 (produção) / SQLite (testes locais)
- **Ambientes:** Local (Docker Compose), Staging (Coolify), Produção (Coolify com HTTPS)
- **Repositório:** Monorepo unificado
  - `/backend` — API Django Ninja
  - `/frontend` — Next.js (Landing pública + Web SaaS)
  - `/mobile` — Flutter (App)
  - `/docs` — Documentação e roteiros
- **Documentação/API:** Swagger em `/api/docs` (Django Ninja)
- **URL Landing (dev):** http://localhost:3000
- **URL SaaS (dev):** http://localhost:3000/dashboard/*
- **URL API (dev):** http://localhost:8000
- **Healthcheck API:** `GET /api/health/` (básico) e `GET /api/health/?deep=1` (com BD)

---

## Objetivo Principal

Verificar se a plataforma **SkillFlow** está 100% integrada, consistente e sem lacunas de implementação entre todos os componentes:

1. ✅ Integração **App Mobile (Flutter) ↔ Backend (Django Ninja) ↔ Banco (PostgreSQL)** funciona perfeitamente;
2. ✅ Integração **Web SaaS (Next.js) ↔ Backend (Django Ninja) ↔ Banco (PostgreSQL)** funciona perfeitamente;
3. ✅ Todos os **endpoints do backend** estão corretamente implementados e consumidos nos frontends (Web + Mobile);
4. ✅ Não falta nenhuma **funcionalidade do backend** nas interfaces (Web/Mobile);
5. ✅ **Links, rotas, navegação, redirecionamentos** e estados de erro/sucesso estão corretos;
6. ✅ Não existem **inconsistências de contrato** (tipos, campos, status codes, validações, paginação, autenticação);
7. ✅ **Fluxos críticos** (autenticação, submissão de exercícios, correção, analytics) funcionam ponta a ponta;
8. ✅ **Segurança, confiabilidade e qualidade de dados** atendem aos padrões de produção;
9. ✅ **Pipeline assíncrono (Celery/Redis)** para correção de dissertativas e geração de analytics funciona sem falhas;
10. ✅ **Migrações de banco, relacionamentos e integridade referencial** estão íntegros.

---

## Instruções de Execução

### Fase 1: Mapeamento da Arquitetura

**1.1. Backend - Módulos e Endpoints**

Faça varredura completa dos módulos Django:

- `accounts/` — Autenticação (login, register, logout, refresh token, recuperação de senha)
- `escolas/` — Gestão de escolas (auto-cadastro público, CRUD)
- `atividades/` — CRUD de atividades e exercícios (tipos: EXERCICIO, PROVA; status: DRAFT, AGENDADO, PUBLICADO)
- `submissoes/` — Submissões de alunos (síncronas para MC, assíncronas para dissertativas)
- `analytics/` — Dados agregados e mapas de dificuldade por disciplina
- `responsaveis/` — Gestão de pais/responsáveis e vínculos com alunos

Para cada módulo, liste:
- **Endpoints disponíveis** (método HTTP, rota, parâmetros, autenticação requerida)
- **Contratos de entrada/saída** (campos obrigatórios/opcionais, tipos, validações)
- **Regras de negócio** (permissões por role, cálculo de notas, drip content, etc.)
- **Modelos do banco** (tabelas principais, relacionamentos, índices)

**1.2. Frontend Web (Next.js) - Telas e Componentes**

Mapeie:
- **Rotas públicas:** `/` (Landing), `/cadastro-escola` (Auto-cadastro)
- **Rotas protegidas:** `/login`, `/dashboard/*` (Professores/Coordenadores)
- **Funcionalidades por tela:** Listar atividades, criar atividade, editar, visualizar submissões, analytics, etc.
- **Componentes reutilizáveis:** Tabelas, forms, modais, abas, gráficos
- **Fluxos de autenticação:** Login/Logout, refresh token, força mudança de senha
- **Tratamento de erros:** Páginas de erro (404, 401, 403, 500), toasts, modais

**1.3. Mobile (Flutter) - Telas e Fluxos**

Mapeie:
- **Telas para Aluno:** Login, listar atividades, responder exercício (MC + dissertativa com câmera/PDF), submeter, visualizar notas, chat, painel de progresso
- **Telas para Responsável:** Login, listar filhos, visualizar boletim (somente leitura)
- **Suporte Offline-first:** Cache de atividades, fila de submissões pendentes, sincronização com servidor
- **Push Notifications:** Recebimento de notificação de correção
- **Integração com câmera:** Captura de PDF de resolução dissertativa

**1.4. Banco de Dados**

Valide:
- **Tabelas principais:** `User`, `School`, `Teacher`, `Student`, `Guardian`, `Activity`, `Exercise`, `Submission`, `Note`, `Analytics`
- **Relacionamentos:** Quem faz referência a quem, integridade referencial (ON DELETE, ON UPDATE)
- **Índices essenciais:** Campos de busca/filtro frequentes (ex: `user.email`, `activity.school_id`, `submission.student_id`)
- **Migrações:** Se há migrações pendentes, conflitantes ou não aplicadas

**1.5. Integrações Externas**

Valide presença e configuração de:
- **Autenticação JWT:** Access token + Refresh token + Blacklist
- **Serviço de IA:** OpenAI ou Claude mockado (para correção de dissertativas e geração de exercícios)
- **OCR/PDF:** Biblioteca para extração de texto de PDFs (dissertativas + cadastro em massa)
- **Armazenamento de arquivos:** Local (dev) ou S3 (prod) para PDFs
- **Push Notifications:** Firebase Cloud Messaging (FCM) para alunos
- **Celery/Redis:** Worker para tarefas assíncronas, Beat para agendamentos

---

### Fase 2: Matriz de Rastreabilidade Obrigatória

Gere uma **tabela completa** mapeando funcionalidades do backend aos frontends:

| Funcionalidade | Endpoint Backend | Regra de Negócio | Tabela/Modelo BD | Tela Web (SaaS) | Tela Mobile (App) | Status | Evidência | Observações |
|---|---|---|---|---|---|---|---|---|
| Auto-cadastro de Escola | `POST /api/auth/cadastro-escola` | Cria Escola + Coordenador em uma transação | `school`, `user` | `/cadastro-escola` | N/A (público) | OK/PARCIAL/FALTANDO | URL funcional/erro | |
| Login (Coordenador/Professor) | `POST /api/auth/login` | Retorna access + refresh token | `user`, `token_blacklist` | `/login` | N/A (web-only) | | | |
| Login (Aluno/Responsável) | `POST /api/auth/login` | Valida role, rejeita não-alunos | `user` | N/A | `/login` no app | | | |
| Logout | `POST /api/auth/logout` | Adiciona token a blacklist | `token_blacklist` | Botão em header | Botão em menu | | | |
| Recuperação de Senha | `POST /api/auth/password-reset` | Gera token com expiração | `user` | Página de reset | Tela de reset | | | |
| Listagem de Atividades (Aluno) | `GET /api/app/atividades/` | Filtra por turma, data_liberacao <= NOW, status != DRAFT | `activity`, `student_class` | N/A | Lista em home | | | |
| Listagem de Atividades (Professor) | `GET /api/saas/atividades/` | Filtra por turmas do professor | `activity` | Aba "Atividades" | N/A | | | |
| Criação de Atividade | `POST /api/saas/atividades/` | Tipo (EXERCICIO/PROVA), peso (obrigatório se PROVA), data_liberacao e data_limite opcionais em DRAFT | `activity`, `exercise` | Form "Nova Atividade" | N/A | | | |
| Edição de Atividade (DRAFT) | `PATCH /api/saas/atividades/{id}/` | Permite editar tudo em DRAFT; PUBLICADA permite apenas estender data_limite | `activity` | Form em modal/página | N/A | | | |
| Submissão (Múltipla Escolha) | `POST /api/app/submissoes/` | Correção síncrona, nota binária (0 ou 100) | `submission` | N/A | Resposta direta após selecionar alternativa | | | |
| Submissão (Dissertativa) | `POST /api/app/submissoes/` + Celery | Enfileira tarefa OCR+IA, status = PENDENTE → EM_PROCESSAMENTO → CORRIGIDA | `submission`, `celery_task` | N/A | Upload de PDF + envio | | | |
| Visualização de Notas (Aluno) | `GET /api/app/painel/` | Consolidação por atividade e média geral | `submission`, `activity` | N/A | Painel de progresso | | | |
| Visualização de Correções (Professor) | `GET /api/saas/submissoes/?atividade_id=X` | Filtra por atividade, mostra nota e feedback | `submission` | Tela "Submissões" | N/A | | | |
| Override de Nota | `PATCH /api/saas/submissoes/{id}/nota` | Atualiza nota, status = REVISADA_PROFESSOR, recalcula média | `submission`, `grade_override` | Form em modal | N/A | | | |
| Criação em Massa (PDF) | `POST /api/saas/cadastro-massa/` + Celery | Processa PDF, extrai nomes/emails via OCR+IA, cria alunos | `student`, `celery_task` | Upload form | N/A | | | |
| Listagem de Alunos (Turma) | `GET /api/saas/turmas/{id}/alunos/` | Filtra por turma; coordenador vê todas, professor vê suas turmas | `student` | Tabela em turma | N/A | | | |
| Transferência de Aluno | `PATCH /api/saas/alunos/{id}/transferir` | Coordenador only, preserva histórico | `student`, `student_history` | Modal em tabela | N/A | | | |
| Gestão de Responsáveis | `GET/POST/PATCH /api/saas/responsaveis/` | Coordenador cria e vincula a alunos da mesma escola | `guardian`, `guardian_student` | Tela "Responsáveis" | N/A | | | |
| Visualização de Boletim (Responsável) | `GET /api/app/boletim/` | Somente leitura, filtra por filhos vinculados | `guardian_student`, `submission` | N/A | Tela de boletim no app | | | |
| Analytics (Filtro Disciplina) | `GET /api/saas/analytics/?discipline=X` | Agregação de erros por habilidade | `analytics` | Gráficos no dashboard | N/A | | | |
| Chat com Tutor (Aluno) | `POST /api/app/chat/` + Celery | Aluno pergunta, IA responde com RAG do material | `chat_message`, `celery_task` | N/A | Tela de chat no app | | | |
| Drip Content (Agendamento) | Endpoint + Celery Beat | Task periódica transiciona AGENDADO → PUBLICADO se data_liberacao <= NOW | `activity` | Selector datetime em form | N/A | | | |
| Healthcheck | `GET /api/health/` | Valida conexão com DB se `deep=1` | N/A | Usado por DevOps | Pode estar usado em startup do app | | | |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Instruções para preenchimento:**
- Preencha esta tabela **completamente** — não deixe linhas em branco.
- Para cada funcionalidade, valide que o backend está implementado **E** consumido no frontend (Web OU Mobile).
- Se faltar no frontend, marque como `FALTANDO` e adicione uma observação explicando o impacto.
- Se estiver parcialmente integrado (ex: backend ok, frontend com UI incompleta), marque `PARCIAL`.

---

### Fase 3: Testes E2E de Fluxos Críticos

Execute testes ponta a ponta (E2E) manualmente ou com suite automatizada:

#### 3.1. Fluxo de Autenticação (Web)

- [ ] Acessar `/login` → formulário carrega
- [ ] Tentar login com credenciais inválidas → erro 401 exibido
- [ ] Login com credenciais válidas (Coordenador) → redireciona para `/dashboard` com token salvo
- [ ] Refresh token automático → antes de expiração, access token é renovado (verificar no browser DevTools)
- [ ] Logout → token removido, redireciona para `/login`
- [ ] Tentar acessar rota protegida sem token → redireciona para `/login`
- [ ] Recuperação de senha → email/token validado, nova senha aceita

#### 3.2. Fluxo de Autenticação (App Mobile)

- [ ] Aluno faz login → valida turma e escola
- [ ] Responsável faz login → interface diferenciada, sem acesso a criação
- [ ] Professor tenta fazer login no app → erro "Acesso restrito a docentes"
- [ ] Refresh token → funciona offline e online
- [ ] Logout → apaga dados locais

#### 3.3. Criação de Atividade (Web → Aluno)

- [ ] Professor cria atividade tipo EXERCICIO com 3 exercícios (1 MC, 2 dissertativas)
- [ ] Atividade fica em DRAFT
- [ ] Professor publica/agenda a atividade com data_liberacao e data_limite
- [ ] Status transiciona para AGENDADO, depois PUBLICADO (automático via Celery Beat)
- [ ] Aluno vê atividade no app (somente após data_liberacao)
- [ ] Aluno responde e submete antes de data_limite → submissões são aceitas
- [ ] Aluno tenta submeter após data_limite → erro 400 "Atividade encerrada"

#### 3.4. Correção Múltipla Escolha (E2E)

- [ ] Aluno seleciona alternativa de MC no app
- [ ] App envia submissão via `POST /api/app/submissoes/`
- [ ] Backend valida gabarito e retorna nota (0 ou 100) **imediatamente**
- [ ] Aluno vê nota na tela do app em tempo real
- [ ] Professor vê submissão marcada como CORRIGIDA no dashboard Web

#### 3.5. Correção Dissertativa (E2E)

- [ ] Aluno tira foto da resolução via câmera ou seleciona PDF
- [ ] App compacta PDF e envia via `POST /api/app/submissoes/` com `timestamp_local`, `server_time_snapshot`, `client_server_offset_ms`
- [ ] Backend retorna `status = PENDENTE` imediatamente
- [ ] Submissão aparece como "Corrigindo..." no app do aluno
- [ ] Celery Worker:
  - Extrai texto do PDF via OCR
  - Monta prompt com gabarito + resposta do aluno
  - Chama LLM (mock ou real)
  - Grava nota (0-100) e feedback
  - Atualiza status para CORRIGIDA
- [ ] Aluno recebe **Push Notification** "Sua atividade foi corrigida"
- [ ] Aluno vê nota e feedback no app
- [ ] Professor vê submissão e feedback no dashboard Web

#### 3.6. Override de Nota (Web → Aluno)

- [ ] Professor visualiza submissão com nota IA = 70
- [ ] Professor clica "Override" → modal com novo valor
- [ ] Professor muda nota para 85 → Backend atualiza, recalcula média
- [ ] Aluno vê nota atualizada no app (próxima sincronização)

#### 3.7. Gestão de Alunos (Coordenador)

- [ ] Coordenador acessa `/dashboard/turmas/{turma_id}/alunos`
- [ ] Lista alunos com nomes e notas
- [ ] Seleciona aluno → pode transferir para outra turma
- [ ] Aluno é transferido, histórico preservado
- [ ] Novo professor vê aluno apenas com atividades da nova turma

#### 3.8. Cadastro em Massa (Coordenador)

- [ ] Coordenador faz upload de PDF com lista de alunos (nome + email)
- [ ] Sistema exibe "Processando..." (tarefa Celery enfileirada)
- [ ] OCR extrai dados, IA estrutura JSON
- [ ] Alunos são criados com senhas provisórias
- [ ] Relatório mostra sucesso/falha (emails duplicados, formatos inválidos)

#### 3.9. Responsável visualiza Boletim (App Mobile)

- [ ] Responsável faz login no app
- [ ] Vê lista de filhos vinculados
- [ ] Clica em filho → visualiza boletim com atividades realizadas e notas
- [ ] **Não consegue submeter, editar ou fazer qualquer ação de escrita**

#### 3.10. Analytics (Web)

- [ ] Professor acessa dashboard analytics
- [ ] Filtra por disciplina/matéria
- [ ] Visualiza gráfico de "Maiores dificuldades" por habilidade
- [ ] Dados agregados conferem com submissões do banco

#### 3.11. Tratamento de Erros

- [ ] **400 Bad Request:** Dados inválidos (ex: email já cadastrado) → mensagem clara no frontend
- [ ] **401 Unauthorized:** Token expirado → frontend tenta refresh, se falhar redireciona para login
- [ ] **403 Forbidden:** Tentando acessar atividade de outra turma → mensagem "Acesso negado"
- [ ] **404 Not Found:** Recurso inexistente → página amigável 404
- [ ] **409 Conflict:** Email duplicado em cadastro em massa → relatório indica qual linha falhou
- [ ] **422 Unprocessable Entity:** Validação (ex: peso de prova < 1) → erro field-level no formulário
- [ ] **500 Internal Server Error:** Backend com erro → página de erro genérica, log no backend

#### 3.12. Validação de Prazo Offline (App)

- [ ] Aluno baixa atividade localmente (cache)
- [ ] App fica offline
- [ ] Aluno responde questões (timestamp_local registrado)
- [ ] Aluno vai online, sincroniza
- [ ] Backend valida `timestamp_local + client_server_offset_ms` contra `data_limite`
- [ ] Se dentro do prazo (+ tolerância 5 min), aceita; caso contrário, marca como conflito

---

### Fase 4: Validação de Contrato Backend/Frontend

#### 4.1. Estrutura de Resposta JSON

Valide que todas as respostas do backend seguem o padrão:

```json
{
  "status": "success|error",
  "data": { /* payload específico ou null */ },
  "message": "mensagem legível em português",
  "errors": [ /* array de erros específicos, se houver */ ]
}
```

- [ ] Todos os endpoints retornam este envelope
- [ ] Status HTTP está alinhado com `status` e conteúdo (ex: 200 + success, 400 + error)
- [ ] `data` contém o recurso/lista esperado
- [ ] Mensagens de erro são úteis e em português

#### 4.2. Campos Obrigatórios vs Opcionais

Valide para cada modelo chave:

**User (Autenticação):**
- [ ] Obrigatórios: `email`, `password` (no registro)
- [ ] Opcionais: `phone`, `avatar`
- [ ] Privados: `password` nunca é retornado (mesmo hasheado)

**Activity (Atividade):**
- [ ] Obrigatórios: `title`, `discipline`, `type` (EXERCICIO|PROVA), `school_id`
- [ ] Opcionais em DRAFT: `data_liberacao`, `data_limite`
- [ ] Obrigatórios ao publicar: `data_liberacao`, `data_limite`
- [ ] `peso` obrigatório se `type = PROVA`

**Exercise (Exercício):**
- [ ] Obrigatórios: `question_text`, `type` (MULTIPLE_CHOICE|DISSERTATIVE), `activity_id`
- [ ] Se MC: `alternatives` array com 4+ opções, `correct_answer`
- [ ] Se dissertativa: `gabarito` (texto esperado ou rubrica IA)

**Submission (Submissão):**
- [ ] Obrigatórios: `exercise_id`, `student_id`, `timestamp_local`
- [ ] Opcionais: `server_time_snapshot`, `client_server_offset_ms`, `atividade_updated_at_snapshot` (apenas app)
- [ ] Retornados: `status`, `note`, `feedback`

#### 4.3. Formatos

Valide padronização:

- [ ] **Datas:** ISO 8601 UTC (ex: `2026-04-30T15:30:00Z`)
- [ ] **Moeda:** Decimal com 2 casas (ex: `99.99`), ou inteiros se notas (0-100)
- [ ] **Notas:** Sempre 0-100 (inclusive parciais)
- [ ] **IDs:** UUID v4 ou inteiro sequencial (ser consistente)
- [ ] **Enum:** Backend lista valores esperados (ex: `status IN [DRAFT, AGENDADO, PUBLICADO]`)
- [ ] **Paginação:** Sempre `{ limit, offset, total, results: [...] }`

#### 4.4. Status HTTP

Valide uso correto:

| Caso | Status | Exemplo |
|------|--------|---------|
| Sucesso | 200 OK | GET atividade |
| Criado | 201 Created | POST atividade |
| Aceito (sem body) | 204 No Content | DELETE atividade |
| Erro validação | 400 Bad Request | Campo obrigatório faltando |
| Não autenticado | 401 Unauthorized | Token expirado |
| Não autorizado | 403 Forbidden | Tentando editar atividade de outra turma |
| Não encontrado | 404 Not Found | GET atividade inexistente |
| Conflito | 409 Conflict | Email duplicado |
| Validação (específico) | 422 Unprocessable Entity | Peso de prova < 1 |
| Erro servidor | 500 Internal Server Error | Bug no backend |

#### 4.5. Versionamento de API

- [ ] Verificar se há rota `/api/v1/` ou similar para compatibilidade futura
- [ ] Ou confirmar que frontend e backend evoluem em sincronia (monorepo)

#### 4.6. CORS e Variáveis de Ambiente

- [ ] Backend permite CORS de origins esperadas (frontend URL, app mobile URL)
- [ ] `NEXT_PUBLIC_API_URL` no frontend está correto para cada ambiente (local/staging/prod)
- [ ] App mobile tem `baseUrl` configurado corretamente
- [ ] Em produção, nenhum `localhost` deve estar hardcoded

---

### Fase 5: Validação de Banco de Dados

#### 5.1. Migrações

- [ ] Executar `python manage.py migrate` sem erros
- [ ] Verificar se há migrações pendentes: `python manage.py showmigrations`
- [ ] Se pendente, listar qual módulo falta: `python manage.py showmigrations [app]`

#### 5.2. Integridade Referencial

Valide relacionamentos críticos:

- [ ] `User.school_id → School.id` (ON DELETE: CASCADE ou RESTRICT?)
- [ ] `Student.turma_id → Class.id` (ON DELETE: RESTRICT, preservar histórico)
- [ ] `Submission.exercise_id → Exercise.id` (ON DELETE: CASCADE, limpeza em cascata)
- [ ] `Submission.student_id → Student.id` (ON DELETE: CASCADE)
- [ ] `Guardian.school_id → School.id` (Guardian pertence a uma escola)
- [ ] `Guardian_Student.guardian_id + student_id` (Vinculação M2M ou FK dupla)

#### 5.3. Índices Essenciais

Verifique se existem índices em:

- [ ] `User.email` (busca por login)
- [ ] `User.school_id` (filtro por escola)
- [ ] `Student.turma_id` (filtro por turma)
- [ ] `Activity.school_id` (filtro por escola)
- [ ] `Activity.status` (filtro por DRAFT/AGENDADO/PUBLICADO)
- [ ] `Submission.student_id + exercise_id` (unicidade e busca)
- [ ] `Submission.status` (filtro por PENDENTE/CORRIGIDA)

#### 5.4. Dados Órfãos / Inconsistências

Execute queries para validar:

```sql
-- Alunos sem turma associada
SELECT * FROM student WHERE turma_id IS NULL;

-- Submissões de exercícios deletados
SELECT s.* FROM submission s
LEFT JOIN exercise e ON s.exercise_id = e.id
WHERE e.id IS NULL;

-- Usuários em escola deletada (se ON DELETE CASCADE ainda deixar orphans)
SELECT u.* FROM user u
LEFT JOIN school s ON u.school_id = s.id
WHERE s.id IS NULL AND u.role != 'ADMIN';
```

- [ ] Executar e verificar que não há resultados
- [ ] Se houver, listar e determinar causa + plano de limpeza

#### 5.5. Modelo de Domínio vs Schema Real

Valide que tabelas/campos existem conforme PRD:

- [ ] Tabela `Activity` tem campos: `id`, `title`, `discipline`, `type` (ENUM), `school_id`, `status` (ENUM), `data_liberacao`, `data_limite`, `peso` (nullable se tipo != PROVA), `created_at`, `updated_at`
- [ ] Tabela `Submission` tem: `id`, `exercise_id`, `student_id`, `answer_text|answer_pdf_url`, `timestamp_local`, `server_time_snapshot`, `client_server_offset_ms`, `status` (ENUM: PENDENTE, EM_PROCESSAMENTO, CORRIGIDA, REVISADA_PROFESSOR), `note`, `feedback`, `created_at`
- [ ] Tabela `Guardian` tem: `id`, `user_id`, `school_id`
- [ ] Tabela `Guardian_Student` (M2M) com `guardian_id`, `student_id`

---

### Fase 6: Validação de Links e Site

#### 6.1. Landing Page

- [ ] Acessar `http://localhost:3000` → carrega sem erros 404/500
- [ ] Validar SEO:
  - [ ] `<title>` presente e descritivo
  - [ ] `<meta name="description">` presente
  - [ ] `<h1>` único e relevante
  - [ ] Headings em hierarquia correta (h1 → h2 → h3)
  - [ ] `<meta name="viewport">` para responsividade
  - [ ] `<meta property="og:*">` (OpenGraph, se necessário)

#### 6.2. Links Internos e Navegação

- [ ] Logo na landing redireciona para `/` (home)
- [ ] CTA "Cadastro de Escola" redireciona para `/cadastro-escola`
- [ ] CTA "Entrar" redireciona para `/login`
- [ ] Após login, usuário é redirecionado para `/dashboard`
- [ ] Sidebar de navegação tem links para:
  - [ ] Atividades
  - [ ] Turmas
  - [ ] Alunos
  - [ ] Analytics
  - [ ] Responsáveis (se coordenador)
  - [ ] Configurações
- [ ] Todos os links funcionam (status 200)

#### 6.3. Rotas Quebradas

- [ ] Acessar rota inexistente (ex: `/dashboard/rotas-inexistente`) → página 404 amigável
- [ ] Página 404 tem botão para voltar à home
- [ ] Página 500 exibida quando backend retorna erro

#### 6.4. Redirecionamentos

- [ ] Usuário não autenticado tenta acessar `/dashboard` → redireciona para `/login` (302 ou 307)
- [ ] Após logout, usuário é redirecionado para home `/`
- [ ] Recuperação de senha após email → link funciona uma única vez, depois expire

#### 6.5. Responsividade (Devices)

- [ ] Landing page é responsiva (mobile 320px, tablet 768px, desktop 1920px)
- [ ] Dashboard SaaS é responsivo (sidebar colapsável em mobile)
- [ ] Formulários adaptam-se ao tamanho da tela (campos empilhados em mobile)

#### 6.6. CORS, baseURL, Variáveis de Ambiente

- [ ] Frontend `.env.local`:
  - [ ] `NEXT_PUBLIC_API_URL` aponta para API correta (localhost:8000 em dev)
  - [ ] `NEXT_PUBLIC_USE_MOCKS` está correto (true para dev sem backend, false para integração real)
- [ ] App Flutter:
  - [ ] `apiBaseUrl` está correto (localhost:8000 em dev, API real em staging/prod)
  - [ ] certificados SSL válidos em produção
- [ ] Backend `.env`:
  - [ ] `ALLOWED_HOSTS` inclui frontend URL
  - [ ] `CORS_ALLOWED_ORIGINS` inclui frontend e app URLs
  - [ ] Sem `localhost` hardcoded em produção

---

### Fase 7: Validação de Segurança e Confiabilidade

#### 7.1. Autenticação / Autorização

- [ ] JWT access token tem expiração curta (ex: 15 minutos)
- [ ] JWT refresh token tem expiração longa (ex: 7 dias)
- [ ] Refresh token é revogado ao logout (stored em blacklist ou banco)
- [ ] Tentativa de usar token revogado → erro 401
- [ ] Professor não consegue acessar atividades de outras escolas
- [ ] Coordenador não consegue acessar dados de escolas diferentes da sua
- [ ] Aluno não consegue ver submissões de outros alunos
- [ ] Aluno não consegue mudar para outra turma diretamente

#### 7.2. Validação/Sanitização de Input

- [ ] Campos de texto longas (ex: title) têm limite (ex: 255 caracteres)
- [ ] Emails são validados (RFC 5322 básico)
- [ ] PDFs de upload são validados:
  - [ ] Tipo MIME é `application/pdf` (não `exe` ou `zip` disfarçado)
  - [ ] Tamanho máximo = 10 MB
  - [ ] Não há verificação de conteúdo malicioso? (considerar antivírus/sandbox)
- [ ] Senhas têm requisitos mínimos (8+ caracteres, complexidade, etc.)

#### 7.3. Exposição de Dados Sensíveis

- [ ] Password nunca é retornado em endpoints (verificar JSON responses)
- [ ] Token (JWT) não é logado em texto pleno (riscos no /logs)
- [ ] Email de aluno não é exposto para outros alunos (apenas professor/coordenador vê)
- [ ] Responsável só vê dados dos seus filhos
- [ ] Admin API (Django admin) tem proteção de IP/autenticação forte

#### 7.4. Rate Limiting / Anti-Abuso

- [ ] Endpoint de login tem rate limit (ex: 5 tentativas por 15 minutos)
- [ ] Endpoint de cadastro em massa tem rate limit (ex: 1 por dia por usuário)
- [ ] Endpoint de chat tem rate limit (ex: 10 mensagens por minuto)
- [ ] API healthcheck (/api/health/) é público e sem rate limit (para monitoramento)

#### 7.5. Logs e Observabilidade

- [ ] Logs de erro incluem:
  - [ ] Timestamp (UTC)
  - [ ] Stack trace completo (em dev/staging, omitir em prod)
  - [ ] Contexto (user_id, atividade_id, etc.)
  - [ ] Nível (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- [ ] Logs **não incluem** dados sensíveis (password, token, email em dev)
- [ ] Logs são persistidos (arquivo ou serviço centralizado, ex: ELK)
- [ ] Monitoramento ativo (alertas para erros críticos, taxa de erro > threshold)

#### 7.6. Qualidade de Mensagens de Erro

- [ ] Mensagens de erro são úteis e em português:
  - ✅ "Email já cadastrado. Tente outro ou recupere sua senha."
  - ❌ "Unique constraint violated on field 'email'"
- [ ] Erros nunca expõem stack trace ao usuário final (apenas em dev/staging)
- [ ] Erros de validação indicam qual campo está errado

#### 7.7. Confiabilidade do Pipeline Assíncrono

- [ ] Celery Worker está rodando (verificar status)
- [ ] Redis está rodando e acessível
- [ ] Tarefas enfileiradas com sucesso (verificar log do worker)
- [ ] Retry automático para falhas transitórias (ex: timeout de LLM):
  - [ ] Configurado para máximo 3 retentativas
  - [ ] Backoff exponencial (1s, 2s, 4s)
- [ ] Tarefas que falham após retries vão para Dead Letter Queue ou log de erro
- [ ] Celery Beat está rodando (verificar logs)
- [ ] Agendamento de drip content funciona (atividades transitam de AGENDADO → PUBLICADO corretamente)

#### 7.8. Backup e Disaster Recovery

- [ ] Backup automático do banco PostgreSQL (ex: diário)
- [ ] PDFs de submissões estão em armazenamento replicado (S3 em prod)
- [ ] Plano de recuperação documentado (RTO, RPO)

---

## Regras de Resposta (Obrigatório)

Responda em **português-BR**. Estruture a resposta em **5 blocos principais**:

---

## 1) Diagnóstico Executivo

Forneça um resumo curto com nota geral de **0–10** para cada dimensão:

| Dimensão | Nota | Comentário |
|----------|------|-----------|
| **Integração Backend/Frontend Web** | [0-10] | Exemplo: Endpoints consumidos, forma, completude |
| **Integração Backend/Mobile (App)** | [0-10] | Exemplo: Auth, submissão, cache offline funciona? |
| **Cobertura Funcional (FE vs BE)** | [0-10] | % de endpoints do backend que estão implementados no frontend |
| **Integridade do Banco de Dados** | [0-10] | Migrações, índices, relacionamentos, dados órfãos |
| **Confiabilidade de Links/Rotas** | [0-10] | SEO, navegação, redirecionamentos, CORS |
| **Prontidão para Produção (Segurança)** | [0-10] | Auth, validação, rate limit, exposição de dados, logs |

**Nota Final (média ponderada):** X/10

**Resumo Executivo (máximo 5 frases):**
- Parágrafo explicando estado geral da integração
- Principais riscos ou lacunas
- Recomendação de próximos passos (imediatos vs. nice-to-have)

---

## 2) Matriz Backend vs Frontend

Tabela completa mapeando **tudo que existe no backend** e confirmando implementação no frontend:

| # | Funcionalidade | Endpoint | Status | Implementação Web | Implementação Mobile | Observações |
|---|---|---|---|---|---|---|
| 1 | Auto-cadastro escola | POST /api/auth/cadastro-escola | OK/PARCIAL/FALTANDO | ✅ `/cadastro-escola` | N/A | |
| 2 | Login coordenador/professor | POST /api/auth/login | | ✅ `/login` | N/A | |
| 3 | Login aluno | POST /api/auth/login | | N/A | ✅ Tela login app | |
| 4 | Login responsável | POST /api/auth/login | | N/A | ✅ Tela login (role diferenciado) | |
| 5 | Logout | POST /api/auth/logout | | ✅ Botão em header | ✅ Menu | |
| 6 | Recuperação senha | POST /api/auth/password-reset | | ✅ Página reset | ✅ Tela reset app | |
| 7 | Listagem atividades (aluno) | GET /api/app/atividades/ | | N/A | ✅ Home app | |
| 8 | Listagem atividades (professor) | GET /api/saas/atividades/ | | ✅ Aba atividades | N/A | |
| 9 | Criação atividade | POST /api/saas/atividades/ | | ✅ Form nova atividade | N/A | |
| ... | ... | ... | ... | ... | ... | ... |

**Legenda:**
- ✅ = Implementado e funcional
- ⚠️ = Implementado mas com bugs/incompleto
- ❌ = Não implementado (FALTANDO)
- N/A = Não aplicável (ex: função não precisa de mobile)

**Seção "FALTANDO" (priorize no topo):**
- Listar **explicitamente** cada funcionalidade de backend sem implementação no frontend
- Indicar impacto (crítico, alto, médio, baixo)
- Incluir sugestão de esforço para implementar

---

## 3) Bugs e Gaps Priorizados

Liste por ordem de criticidade:

### P0 — Crítico (Impede produção)
1. **[TÍTULO DO BUG]**
   - **Causa provável:** 
   - **Evidência:** (teste realizado, curl, screenshot, log, etc.)
   - **Impacto:** (qual funcionalidade quebra ou usuário é afetado)
   - **Como reproduzir:** (passo a passo)
   - **Correção sugerida:**
     - **Backend:** (ação específica no código Django)
     - **Frontend:** (ação específica no Next.js ou Flutter)
     - **Banco:** (migração, índice, etc.)

### P1 — Alto (Afeta experiência ou dados)
2. [TÍTULO]
   - ...

### P2 — Médio (Usabilidade, performance, cosmético)
3. [TÍTULO]
   - ...

### P3 — Baixo (Nice-to-have, documentação, etc.)
4. [TÍTULO]
   - ...

---

## 4) Plano de Correção

Checklist objetivo com **ações concretas** para resolver cada gap:

| # | Bug / Gap | Ação | Responsável (BE/FE/DB/DevOps) | Esforço (S/M/L) | Dependências | Critério de Aceite |
|---|---|---|---|---|---|---|
| 1 | Endpoint `POST /api/submissoes/` retorna 500 ao processar PDF > 5MB | Adicionar validação de tamanho antes de enqueueing; retornar 413 Payload Too Large | BE | S | Nenhuma | Teste com PDF 10MB deve retornar 413 |
| 2 | Frontend não exibe feedback IA em submissão dissertativa | Consumir campo `feedback` do endpoint GET submissões; exibir em card/modal | FE | M | Endpoint deve retornar `feedback` | Feedback visível após correção IA |
| 3 | Migrações pendentes no banco | Rodar `python manage.py migrate` e testar | DB/DevOps | S | Backup pré-migração | `python manage.py showmigrations` sem pendentes |
| 4 | CORS bloqueando app mobile | Adicionar URL da app em `CORS_ALLOWED_ORIGINS` | BE/DevOps | S | Nenhuma | App consegue fazer requisição sem CORS error |
| ... | ... | ... | ... | ... | ... | ... |

---

## 5) Veredito Final

Responda claramente as 3 perguntas abaixo:

### 5.1. "Está 100% alinhado?" 
**[ ] SIM** ou **[ ] NÃO**

Se NÃO, justifique brevemente com até 3 pontos principais.

### 5.2. "Falta algo do backend no frontend?" 
**[ ] NADA FALTA** ou **[ ] FALTAM ITENS**

Se FALTAM, liste **exatamente**:
- Nome da funcionalidade
- Endpoint correspondente
- Razão pela qual falta (design decision, priorização, bug, etc.)
- Impacto ao usuário

### 5.3. "Pode ir para produção agora?" 
**[ ] SIM, SEM RESTRIÇÕES** ou **[ ] NÃO, COM CONDIÇÕES** ou **[ ] NÃO, CRÍTICO**

Se condições:
- Listar tudo que **deve** estar corrigido antes de produção
- Tudo que pode ir em próxima iteração (pós-launch)
- RTO de rollback se algo quebrar

---

## Critérios Rígidos (Não negocie)

- ✅ **Não assuma; valide com evidência.** Se faltar informação, liste exatamente o que falta e o impacto.
- ✅ **Não dê resposta genérica.** Aponte inconsistências específicas de nomenclatura, contrato, tipos.
- ✅ **Cote tudo com evidência.** Teste manual, curl, screenshot, log, código.
- ✅ **Se houver divergência Backend vs Frontend**, priorize correção por risco ao usuário final.
- ✅ **Valide offline-first** (app mobile cache, sincronização com timestamp e offset).
- ✅ **Valide pipeline assíncrono** (Celery enfileirando, retrying, notificações via FCM).
- ✅ **Valide banco de dados** (migrações, índices, integridade referencial, dados órfãos).
- ✅ **Respostas em português-BR** (toda matriz, bugs, plano, veredito).

---

## Próximos Passos (Comece Agora)

1. **Inventário completo:** Mapeie todos os módulos do backend, endpoints, models, rotas do frontend
2. **Matriz de rastreabilidade:** Crie a tabela de funcionalidades mapeadas entre backend e frontends
3. **Testes E2E:** Execute manualmente os fluxos críticos (auth, submissão, correção, override)
4. **Validação de banco:** Rode migrações, valide integridade referencial, busque dados órfãos
5. **Relatório detalhado:** Preencha os 5 blocos de resposta com evidências concretas
6. **Plano executivo:** Priorize correções e defina timeline realista

---

**Data da Auditoria:** [DATA]  
**Auditor:** QA Engineer Sênior + Arquiteto Full Stack + Engenheiro de Integração  
**Versão:** 1.0
