# PROMPT DE IMPLEMENTAÇÃO — API BACKEND SKILLFLOW
# Django + Django Ninja + PostgreSQL + Celery

> Use este prompt quando quiser implementar **apenas a API/backend** do SkillFlow.
>
> Documentos obrigatórios de referência:
> 1. `PRD.md` — fonte de verdade das regras de negócio e permissões.
> 2. `TechSpecs.md` — fonte de verdade da arquitetura, esquema PostgreSQL, fluxos assíncronos e endpoints.
> 3. `PROMPT_IMPLEMENTACAO.md` — referência expandida do projeto completo.
> 4. `desafio_software_engineer.md` — critérios do desafio técnico.
>
> Se houver conflito técnico, siga `TechSpecs.md`.
> Se houver conflito de regra de negócio, siga `PRD.md`.
> Este prompt define o recorte exclusivo da API/backend e deve ser lido junto com `PROMPT_IMPLEMENTACAO.md`.

---

## 1. Objetivo

Implementar o backend completo do SkillFlow: API REST com Django Ninja, autenticação JWT, modelagem PostgreSQL, permissões por role, processamento assíncrono com Celery/Redis, serviços mockados de IA/OCR, testes automatizados e **auto-cadastro público de escola + coordenador/diretor**.

Este prompt **não inclui implementação de telas Web, Landing Page ou Flutter**. O backend deve expor contratos estáveis para que Frontend e Mobile sejam implementados separadamente.

---

## 2. Stack Obrigatória

- Python 3.12+
- Django 5+
- Django Ninja 1+
- PostgreSQL 16
- Redis
- Celery 5 + Celery Beat
- `django-ninja-jwt` ou SimpleJWT compatível com Django Ninja
- `pytest`, `pytest-django`, `factory_boy`
- Storage local em desenvolvimento para PDFs e materiais
- Serviço de IA mockado por padrão em desenvolvimento/testes

---

## 3. Estrutura Esperada

```text
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── celery.py
│   └── asgi.py / wsgi.py
├── apps/
│   ├── accounts/
│   ├── escolas/
│   ├── atividades/
│   ├── submissoes/
│   ├── responsaveis/
│   └── analytics/
├── services/
│   ├── llm_service.py
│   ├── pdf_service.py
│   └── notification_service.py
├── tasks/
│   ├── atividades.py
│   ├── submissoes.py
│   └── cadastro_massa.py
├── tests/
├── requirements.txt
├── Dockerfile
└── manage.py
```

---

## 4. Regras Invioláveis

1. Toda rota `/api/saas/*` exige `PROFESSOR` ou `COORDENADOR`.
2. Toda rota `/api/app/responsavel/*` exige `RESPONSAVEL`.
3. Demais rotas `/api/app/*` exigem `ALUNO`.
4. Professores só acessam turmas vinculadas por `ProfessorTurma`.
5. Coordenadores só acessam dados da própria `escola_id`.
6. Alunos pertencem a uma única turma; a escola do aluno é inferida por `aluno.turma.escola`.
7. Responsáveis pertencem a uma escola e só visualizam alunos vinculados por `ResponsavelAluno`.
8. Usuários criados por onboarding interno (aluno/professor/responsável) recebem `senha_provisoria=True`, exceto dados de seed usados para facilitar testes manuais.
9. Login retorna `must_change_password=True` quando aplicável.
10. Atividades `EXERCICIO` têm peso fixo `1`; atividades `PROVA` exigem `peso >= 1`.
11. Atividades em `DRAFT` podem não ter datas; publicação/agendamento exige `data_liberacao` e `data_limite`.
12. O endpoint do app só lista atividades `PUBLICADO` com `data_liberacao <= now`.
13. Submissão online fora do prazo retorna HTTP 400.
14. Submissão offline usa `timestamp_local + client_server_offset_ms` e pode gerar `CONFLITO_SYNC`.
15. Múltipla escolha é corrigida de forma síncrona, sem IA.
16. Dissertativa é corrigida em fila Celery, com PDF e IA/OCR mockáveis.
17. Chat tutor só abre para submissões `CORRIGIDA` ou `REVISADA_PROFESSOR`.
18. Chat permite no máximo 3 mensagens do aluno por submissão.
19. Override individual altera `Submissao` e status para `REVISADA_PROFESSOR`.
20. Override consolidado usa `NotaAtividadeAluno`.
21. `POST /api/auth/cadastro-escola/` é público e cria `Escola + Usuario(role=COORDENADOR)` em transação única, com `senha_provisoria=False`.
22. Rotas públicas de autenticação (`cadastro-escola`, login, esqueci/reset senha) não exigem JWT e devem ter rate limit básico.

---

## 5. Modelagem do Banco

Implemente as models conforme `TechSpecs.md`, especialmente a seção de modelagem e o esquema PostgreSQL físico.

### Apps e entidades

**accounts**
- `Usuario(AbstractUser)`
- `PasswordResetToken`

**escolas**
- `Escola`
- `Turma`
- `ProfessorTurma`

**responsaveis**
- `ResponsavelAluno`

**atividades**
- `MaterialApoio`
- `Atividade`
- `Exercicio`
- `NotaAtividadeAluno`

**submissoes**
- `Submissao`
- `ChatDuvida`
- `RelatorioCadastroMassa`

### Constraints essenciais

- `Usuario.email` único.
- `ProfessorTurma(professor, turma)` único.
- `ResponsavelAluno(responsavel, aluno)` único.
- `Exercicio(atividade, ordem)` único.
- `Submissao(aluno, exercicio)` único.
- `NotaAtividadeAluno(aluno, atividade)` único.
- Notas sempre entre `0` e `100`.
- `data_limite > data_liberacao` quando a atividade não está em `DRAFT`.

### Índices obrigatórios

Crie índices para:
- role e email de usuários;
- `Usuario.turma_id`;
- `Usuario.escola_id`;
- `Atividade(turma_id, status_publicacao, data_liberacao)`;
- `Submissao(aluno_id, status)`;
- `Submissao(exercicio_id, status)`;
- `Submissao.categoria_erro_analytics`;
- vínculos de responsáveis e professores.

---

## 6. Endpoints Obrigatórios

Todos os endpoints devem usar JWT Bearer Token, permissões por role e paginação em listas.

Resposta padrão de paginação:

```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
```

### 6.1. Autenticação

- `POST /api/auth/cadastro-escola/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/trocar-senha/`
- `POST /api/auth/esqueci-senha/`
- `POST /api/auth/reset-senha/`
- `POST /api/auth/logout/`

### 6.2. SaaS — Turmas, Alunos e Professores

- `GET /api/saas/turmas/`
- `GET /api/saas/turmas/{id}/alunos/`
- `GET /api/saas/alunos/?q=busca`
- `POST /api/saas/turmas/{id}/alunos/cadastrar/`
- `POST /api/saas/turmas/{id}/alunos/cadastrar-massa/`
- `GET /api/saas/relatorios-cadastro/{id}/`
- `PUT /api/saas/alunos/{id}/transferir-turma/`
- `POST /api/saas/professores/cadastrar/`
- `GET /api/saas/professores/{id}/turmas/`
- `POST /api/saas/professores/{id}/vincular-turma/`
- `DELETE /api/saas/professores/{id}/desvincular-turma/`
- `GET /api/saas/alunos/{id}/historico/`

### 6.3. SaaS — Responsáveis

- `POST /api/saas/responsaveis/cadastrar/`
- `GET /api/saas/responsaveis/`
- `POST /api/saas/responsaveis/{id}/vincular-aluno/`
- `DELETE /api/saas/responsaveis/{id}/desvincular-aluno/`
- `GET /api/saas/responsaveis/{id}/alunos/`

### 6.4. SaaS — Atividades, Materiais e Ranking

- `POST /api/saas/atividades/`
- `PUT /api/saas/atividades/{id}/`
- `DELETE /api/saas/atividades/{id}/`
- `POST /api/saas/atividades/gerar-ia/`
- `PUT /api/saas/atividades/{id}/aprovar-agendar/`
- `GET /api/saas/atividades/?turma_id=X&tipo=EXERCICIO|PROVA`
- `POST /api/saas/turmas/{id}/materiais/`
- `GET /api/saas/turmas/{id}/materiais/`
- `PUT /api/saas/turmas/{id}/ranking/`
- `GET /api/saas/turmas/{id}/ranking/?tipo=pontuacao|provas`

### 6.5. SaaS — Correções, Override e Analytics

- `GET /api/saas/submissoes/?turma_id=X`
- `GET /api/saas/submissoes/{id}/`
- `PUT /api/saas/submissoes/{id}/override-nota/`
- `PUT /api/saas/atividades/{id}/override-nota-aluno/`
- `PUT /api/saas/submissoes/{id}/resolver-conflito/`
- `GET /api/saas/turmas/{id}/analytics/`

### 6.6. Mobile — Aluno

- `GET /api/app/sync/server-time/`
- `POST /api/app/device-token/`
- `GET /api/app/painel/`
- `GET /api/app/atividades/`
- `GET /api/app/atividades/{id}/exercicios/`
- `POST /api/app/submissoes/`
- `GET /api/app/submissoes/?atividade_id=X`
- `GET /api/app/submissoes/{id}/resultado/`
- `POST /api/app/submissoes/{id}/chat/`
- `GET /api/app/turma/ranking/?tipo=pontuacao|provas`

### 6.7. Mobile — Responsável

- `GET /api/app/responsavel/filhos/`
- `GET /api/app/responsavel/filhos/{aluno_id}/boletim/`
- `GET /api/app/responsavel/filhos/{aluno_id}/boletim/?disciplina=X`

---

## 7. Serviços Assíncronos

Implemente Celery com Redis.

### Tasks obrigatórias

- `corrigir_dissertativa(submissao_id)`
- `gerar_exercicios_ia(atividade_id, material_id, quantidade)`
- `cadastrar_alunos_massa_pdf(relatorio_id)`
- `atualizar_atividades_agendadas()`

### Celery Beat

Configure `atualizar_atividades_agendadas` para executar a cada 60 segundos.

### Serviço de IA

Crie `services/llm_service.py` com:

- `LLMService.corrigir(gabarito, resposta) -> dict`
- `LLMService.gerar_exercicios(material, quantidade) -> list`
- `LLMService.chat_tutor(contexto, mensagens) -> str`
- `MockLLMService` para dev/testes

Todo prompt deve tratar PDFs, respostas e materiais como conteúdo não confiável. A saída do LLM deve ser validada por schema rígido antes de persistir.

---

## 8. Segurança de Uploads

Valide em todo upload:

- extensão `.pdf`;
- MIME real;
- magic bytes de PDF;
- tamanho máximo:
  - submissão dissertativa: 10 MB;
  - material de apoio: 50 MB;
  - cadastro em massa: 10 MB;
- limite de páginas;
- timeout de OCR;
- tratamento de PDF malformado;
- logs estruturados para falhas.

---

## 9. Seed de Desenvolvimento

Crie `python manage.py seed_data` com dados realistas:

- 2 escolas;
- 4 turmas;
- 1 coordenador por escola;
- 3 professores vinculados via `ProfessorTurma`;
- 20 alunos;
- 3 responsáveis vinculados a alunos;
- atividades `EXERCICIO` e `PROVA`;
- exercícios MC e dissertativos;
- submissões e notas de exemplo;
- credenciais impressas no console.

Use `senha_provisoria=False` para usuários de teste principais.

---

## 10. Testes Obrigatórios

Implemente testes com `pytest` e `pytest-django`.

### Suites mínimas

- `test_auth.py`
- `test_permissions.py`
- `test_atividades.py`
- `test_submissoes.py`
- `test_chat.py`
- `test_analytics.py`
- `test_gestao.py`
- `test_responsaveis.py`
- `test_ranking.py`
- `test_painel_aluno.py`
- `test_cadastro_massa.py`
- `test_tasks.py`
- `test_models.py`

### Casos críticos

- professor não acessa turma sem vínculo;
- coordenador não acessa outra escola;
- responsável não acessa filho não vinculado;
- aluno não acessa rotas SaaS;
- docente não acessa rotas App;
- auto-cadastro cria escola e coordenador vinculados na mesma transação;
- prova sem peso retorna erro;
- submissão fora do prazo retorna erro;
- submissão offline incoerente vira `CONFLITO_SYNC`;
- MC corrige síncrono;
- dissertativa enfileira Celery;
- chat bloqueia antes da correção;
- quarta mensagem do chat retorna 403;
- ranking desativado retorna `{ativo: false}`;
- média ponderada considera peso de prova.

---

## 11. Critérios de Pronto

A API está pronta quando:

- `docker-compose up` sobe PostgreSQL, Redis, backend, worker e beat;
- a API está preparada para Coolify com `gunicorn`, `DEBUG=False`, `ALLOWED_HOSTS`, CORS/CSRF por domínio e healthcheck;
- migrations rodam sem erro;
- `seed_data` popula o banco;
- todos os endpoints obrigatórios existem;
- Swagger/OpenAPI do Django Ninja está acessível;
- permissões por role estão cobertas por testes;
- fluxos assíncronos funcionam com mock de IA;
- uploads inválidos são rejeitados;
- listas são paginadas;
- testes passam;
- README do backend explica setup, variáveis de ambiente, comandos no Coolify e credenciais de teste/demo.
