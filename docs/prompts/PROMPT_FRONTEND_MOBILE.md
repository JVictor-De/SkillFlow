# PROMPT DE IMPLEMENTAÇÃO — FRONTEND WEB E MOBILE SKILLFLOW
# Next.js + Flutter

> Use este prompt quando quiser implementar **apenas as interfaces do SkillFlow**: Landing Page, Web SaaS e App Mobile Flutter.
>
> Documentos obrigatórios de referência:
> 1. `PRD.md` — regras de negócio, atores, permissões e jornadas.
> 2. `DESIGN_GUIDELINES.md` — identidade visual, UX e linguagem visual 2026.
> 3. `TechSpecs.md` — contratos da API, fluxos síncronos/assíncronos e dados.
> 4. `PROMPT_IMPLEMENTACAO.md` — referência expandida do projeto completo.
> 5. `desafio_software_engineer.md` — critérios do desafio técnico.
>
> **O backend está implementado e em execução.** Todos os endpoints, schemas de request/response e regras de negócio desta seção foram extraídos diretamente do código e estão corretos como fonte de verdade de integração.
>
> Se houver conflito técnico ou de contrato de API, siga `TechSpecs.md`.
> Se houver conflito de regra de negócio, siga `PRD.md`.
> Se houver conflito visual/UX, siga `DESIGN_GUIDELINES.md`.

---

## 1. Objetivo

Implementar as interfaces do SkillFlow:

- Landing Page pública em Next.js.
- Plataforma Web SaaS em Next.js para Professores e Coordenadores.
- App Mobile Flutter para Alunos e Responsáveis.

Este prompt **não inclui implementação do backend**. Consuma a API conforme os contratos definidos na seção 5 e nas demais referências.

---

## 2. Stack Obrigatória

### Frontend Web

- Next.js 14+ com App Router.
- TypeScript strict.
- TailwindCSS.
- Shadcn/ui.
- Recharts para gráficos.
- Cookies seguros ou storage controlado para autenticação.
- Testes com Jest + Testing Library.

### Mobile

- Flutter 3+.
- Dart 3+.
- Material 3.
- `dio` ou `http` para API.
- `sqflite` ou `drift` para SQLite offline-first.
- `provider` ou `riverpod` para estado.
- `fl_chart` para gráficos e visualização de progresso.
- `firebase_messaging` para push notifications.
- `file_picker`, `camera` e biblioteca de scanner/PDF.
- Testes com `flutter_test`.

---

## 3. Identidade Visual

Siga `DESIGN_GUIDELINES.md`.

Diretrizes centrais:

- visual premium, limpo, moderno e acessível;
- dark mode como experiência principal;
- fundo base `#0a0a0f`;
- cards `#13131a`;
- gradiente principal `#6366f1 → #8b5cf6`;
- uso moderado de glassmorphism;
- sombras suaves;
- tipografia geométrica moderna, preferencialmente Inter, Geist ou Plus Jakarta Sans;
- microinterações em hover, loading e confirmação;
- linguagem clara para cada papel de usuário.

Não sacrifique clareza por efeito visual. Dashboards devem priorizar leitura rápida e produtividade.

---

## 4. Estrutura Esperada

```text
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── cadastro-escola/
│   │   ├── trocar-senha/
│   │   ├── esqueci-senha/
│   │   └── dashboard/
│   ├── components/
│   ├── features/
│   ├── lib/
│   │   ├── api.ts          # cliente HTTP centralizado com refresh automático
│   │   └── auth.ts         # helpers de token, role e must_change_password
│   ├── hooks/
│   ├── types/
│   └── middleware.ts
├── __tests__/
├── tailwind.config.ts
└── package.json

mobile/
├── lib/
│   ├── models/
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── sync_service.dart
│   │   └── notification_service.dart
│   ├── repositories/
│   ├── providers/
│   ├── screens/
│   ├── widgets/
│   └── main.dart
├── test/
└── pubspec.yaml
```

---

## 5. Contratos de API

### 5.1. Configuração de URL

```text
# Desenvolvimento local
NEXT_PUBLIC_API_URL=http://localhost:8000
MOBILE_API_URL=http://10.0.2.2:8000   # emulador Android

# Produção (Coolify)
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
MOBILE_API_URL=https://api.seu-dominio.com
```

Nunca aponte `NEXT_PUBLIC_API_URL` para `localhost` em produção.

### 5.2. Autenticação JWT

Todos os endpoints protegidos exigem:

```
Authorization: Bearer <access_token>
```

Regras de role por interface:

| Interface | Roles aceitas |
|-----------|--------------|
| Web SaaS (`/dashboard/*`) | `PROFESSOR`, `COORDENADOR` |
| App Flutter | `ALUNO`, `RESPONSAVEL` |

- `must_change_password=true` na resposta do login → bloquear qualquer outra navegação e exigir `/trocar-senha` imediatamente.
- Logout deve chamar `POST /api/auth/logout/` com `{refresh_token}` e limpar todo estado local.
- Refresh deve chamar `POST /api/auth/refresh/` com `{refresh_token}`. O backend retorna um novo par de tokens; salve o novo `refresh_token` retornado.

### 5.3. Paginação

Todos os endpoints GET de lista retornam:

```json
{
  "count": 42,
  "next": "http://api.../endpoint/?page=3&page_size=20",
  "previous": "http://api.../endpoint/?page=1&page_size=20",
  "results": [...]
}
```

Parâmetros de query: `?page=1&page_size=20` (máximo 100).

### 5.4. Formato de requisição por tipo

| Tipo | Usado em |
|------|----------|
| `application/json` | Maioria dos endpoints (autenticação, atividades, overrides, ranking, chat) |
| `multipart/form-data` | Upload de material (`POST /api/saas/turmas/{id}/materiais/`), cadastro em massa (`POST /api/saas/turmas/{id}/alunos/cadastrar-massa/`), submissão dissertativa (`POST /api/app/submissoes/`) |

> **Atenção:** `POST /api/app/submissoes/` sempre usa `multipart/form-data`, mesmo para múltipla escolha (sem PDF). O body contém campos de formulário (`exercicio_id`, `resposta_texto`, campos de offset offline) e, quando dissertativa, o campo `pdf` com o arquivo.

### 5.5. Shapes de request/response das rotas principais

#### Auth — Login
```
POST /api/auth/login/
Body: { "email": "...", "senha": "..." }

Response 200:
{
  "access_token": "...",
  "refresh_token": "...",
  "role": "PROFESSOR" | "COORDENADOR" | "ALUNO" | "RESPONSAVEL",
  "must_change_password": false,
  "usuario_id": 42,
  "nome": "Ana Pereira"
}
```

#### Auth — Cadastro de Escola (público)
```
POST /api/auth/cadastro-escola/
Body: {
  "escola_nome": "...",
  "escola_cnpj": "...",
  "coordenador_nome": "...",
  "coordenador_email": "...",
  "coordenador_senha": "..."
}

Response 201:
{
  "escola_id": 1,
  "coordenador_id": 2,
  "access_token": "...",
  "refresh_token": "...",
  "role": "COORDENADOR",
  "must_change_password": false
}
```

#### Auth — Trocar senha
```
POST /api/auth/trocar-senha/
Headers: Authorization Bearer
Body: { "senha_atual": "...", "nova_senha": "..." }
Response 200: { "detail": "Senha atualizada." }
```

#### Auth — Esqueci / Reset
```
POST /api/auth/esqueci-senha/
Body: { "email": "..." }
Response 200: { "detail": "Se o e-mail existir, um token de reset foi enviado." }

POST /api/auth/reset-senha/
Body: { "token": "...", "nova_senha": "..." }
Response 200: { "detail": "Senha redefinida com sucesso." }
```

> Em dev, o token é logado no console do servidor (sem envio de e-mail real).
> Em produção, será enviado por e-mail. O frontend deve instruir o usuário a verificar o e-mail.

#### App — Horário do servidor (para cálculo de offset)
```
GET /api/app/sync/server-time/
Auth: não obrigatório

Response 200:
{
  "server_time": "2026-04-26T19:00:00Z",
  "epoch_ms": 1745694000000
}
```

#### App — Registrar token FCM
```
POST /api/app/device-token/
Headers: Authorization Bearer (apenas ALUNO)
Body: { "token": "<fcm-token>" }
Response 200: { "detail": "Token registrado." }
```

> **Responsáveis retornam 403.** Não tentar registrar token para esse role.

#### App — Painel do Aluno
```
GET /api/app/painel/
Headers: Authorization Bearer (ALUNO)

Response 200:
{
  "media_geral_ponderada": 72,
  "progresso_por_disciplina": [
    { "disciplina": "Matemática", "media": 80 },
    { "disciplina": "Português", "media": 60 }
  ],
  "historico_notas": [
    { "atividade_id": 1, "titulo": "Lista 1", "nota": 80, "data": "2026-04-10T..." }
  ],
  "atividades_pendentes": 2,
  "atividades_concluidas": 5,
  "atividades_em_andamento": 1
}
```

#### App — Envio de submissão (multipart/form-data)
```
POST /api/app/submissoes/
Headers: Authorization Bearer (ALUNO)
Content-Type: multipart/form-data

Campos obrigatórios:
  exercicio_id: <int>

Campos opcionais (MC):
  resposta_texto: "C"

Campos opcionais (Dissertativa):
  pdf: <file.pdf>

Campos de offset offline (todos opcionais):
  timestamp_local: "2026-04-26T18:55:00Z"
  server_time_snapshot: "2026-04-26T18:55:10Z"
  client_server_offset_ms: -500
  atividade_updated_at_snapshot: "2026-04-10T10:00:00Z"

Response 201:
{
  "submissao_id": 99,
  "status": "CORRIGIDA" | "PENDENTE" | "CONFLITO_SYNC",
  "nota_calculada": 100,     // null quando dissertativa ou conflito
  "feedback_ia": "...",      // null quando dissertativa ou conflito
  "correto": true            // null quando dissertativa ou conflito
}
```

#### App — Chat com tutor
```
POST /api/app/submissoes/{id}/chat/
Headers: Authorization Bearer (ALUNO)
Body: { "mensagem": "Por que errei?" }

Response 200:
{
  "mensagens": [
    { "role": "aluno", "content": "Por que errei?" },
    { "role": "ia",    "content": "Boa pergunta! ..." }
  ],
  "contador_mensagens_aluno": 1,
  "limite": 3
}

Response 400: submissão ainda não corrigida
Response 403: contador >= 3 (limite atingido)
```

#### App — Ranking da turma
```
GET /api/app/turma/ranking/?tipo=pontuacao|provas
Headers: Authorization Bearer (ALUNO)

Response 200 (quando ativo):
{
  "ativo": true,
  "tipo": "pontuacao",
  "mensagem": null,
  "ranking": [
    { "posicao": 1, "aluno_id": 5, "nome": "Maria S.", "pontuacao": 280.0 },
    { "posicao": 2, "aluno_id": 7, "nome": "João T.",  "pontuacao": 210.0 }
  ]
}

Response 200 (quando desativado):
{
  "ativo": false,
  "tipo": "pontuacao",
  "mensagem": "O ranking está desativado para esta turma.",
  "ranking": []
}
```

#### App — Boletim do filho (Responsável)
```
GET /api/app/responsavel/filhos/{aluno_id}/boletim/?disciplina=Matemática
Headers: Authorization Bearer (RESPONSAVEL)

Response 200:
{
  "aluno_id": 5,
  "aluno_nome": "João Filho",
  "media_geral_ponderada": 68,
  "provas": [
    {
      "atividade_id": 3, "titulo": "Prova Bimestral", "tipo_atividade": "PROVA",
      "disciplina": "Matemática", "peso": 3, "nota": 72,
      "data": "2026-04-01T..."
    }
  ],
  "exercicios": [
    {
      "atividade_id": 1, "titulo": "Lista 1", "tipo_atividade": "EXERCICIO",
      "disciplina": "Matemática", "peso": 1, "nota": 80,
      "data": "2026-03-15T..."
    }
  ]
}

Response 403: aluno não vinculado ao responsável
```

#### SaaS — Analytics
```
GET /api/saas/turmas/{id}/analytics/
Headers: Authorization Bearer (PROFESSOR | COORDENADOR)

Response 200:
{
  "distribuicao_erros": [
    { "classificacao_erro": "Interpretação de Texto", "count": 14, "percentual": 70.0 }
  ],
  "por_disciplina": [
    { "disciplina": "Matemática", "media_nota": 62 }
  ],
  "por_tipo_atividade": [
    { "tipo": "PROVA",     "media_nota": 55 },
    { "tipo": "EXERCICIO", "media_nota": 72 }
  ],
  "alunos_risco": [
    { "aluno_id": 7, "nome": "Carlos M.", "media_ponderada": 43 }
  ]
}
```

#### SaaS — Upload de material de apoio (multipart)
```
POST /api/saas/turmas/{id}/materiais/
Headers: Authorization Bearer
Content-Type: multipart/form-data
Campos: titulo=<string>, arquivo=<file.pdf>   ← ambos obrigatórios

Response 201: { "id": ..., "titulo": ..., "arquivo_url": ..., ... }
```

#### SaaS — Override de nota individual (submissão)
```
PUT /api/saas/submissoes/{id}/override-nota/
Body: { "nota": 80, "feedback": "Reavaliação..." }   ← um ou ambos

Response 200: objeto Submissao completo
```

#### SaaS — Override de nota consolidada (atividade × aluno)
```
PUT /api/saas/atividades/{id}/override-nota-aluno/
Body: { "aluno_id": 5, "nota": 90 }

Response 200: { "detail": "Override aplicado." }
```

> Este override prevalece sobre o cálculo automático por exercício. Exibir input de nota na tela de detalhe da atividade, por aluno.

#### SaaS — Resolver conflito de sincronização
```
PUT /api/saas/submissoes/{id}/resolver-conflito/
Body: {
  "acao": "aceitar" | "rejeitar" | "solicitar_reenvio",
  "observacao": "..."   ← opcional
}

Response 200: objeto Submissao completo
```

> Só disponível quando `status == "CONFLITO_SYNC"`. Exibir painel de resolução no detalhe da submissão na Web SaaS.

### 5.6. Tratamento de erros

Padronize mensagens amigáveis para o usuário final:

| Código | Causa | Mensagem sugerida |
|--------|-------|-------------------|
| 400 | dados inválidos ou regra de negócio | Exibir `detail` retornado pela API |
| 401 | sessão expirada | "Sua sessão expirou. Faça login novamente." |
| 403 | acesso negado para role ou escopo | "Você não tem permissão para esta ação." |
| 404 | recurso não encontrado | "Item não encontrado." |
| 409 | conflito de estado, duplicidade | Exibir `detail` retornado pela API |
| 500 | erro inesperado do servidor | "Erro interno. Tente novamente mais tarde." |

---

## 6. Landing Page

Rota: `/`

Objetivo: convencer coordenadores/diretores de escola a pedir demonstração.

### Seções obrigatórias

1. **Hero**
   - Título forte: "Transforme a educação com Inteligência Artificial".
   - Subtítulo explicando correção automática, analytics e app offline.
   - CTA primário: "Agendar uma Demonstração".
   - CTA secundário: "Cadastrar minha escola" apontando para `/cadastro-escola`.
   - Mock visual do dashboard web e app mobile.

2. **Como Funciona**
   - Fluxo em 4 etapas:
     - Professor cria atividade na Web.
     - Aluno resolve no App.
     - IA corrige automaticamente.
     - Pais acompanham pelo App.

3. **Features**
   - Correção por IA.
   - Analytics de turma.
   - Criação mágica de exercícios com RAG.
   - App offline-first.
   - Painel para responsáveis.

4. **Prova Social**
   - Depoimentos fictícios realistas de professores/coordenadores.

5. **Download do App**
   - Links placeholder para Google Play e App Store.

6. **CTA Final**
   - Repetir chamada para demonstração.

7. **Footer**
   - Produto, contato, direitos e links institucionais.

### SEO obrigatório

- `<title>` relevante.
- Meta description.
- Open Graph.
- `h1` único.
- HTML semântico.
- Conteúdo acessível por teclado.

---

## 7. Web SaaS

Rotas protegidas sob `/dashboard/*`.

### 7.1. Login e Conta

**`/login`**
- email + senha;
- chama `POST /api/auth/login/`;
- usar o campo `role` da resposta para validar;
- rejeita `ALUNO` e `RESPONSAVEL` com: "Acesso restrito a docentes. Use o aplicativo mobile.";
- se `must_change_password=true`, redirecionar imediatamente para `/trocar-senha` (bloquear qualquer outra rota);
- se sucesso, salvar `access_token`, `refresh_token`, `role` e `usuario_id`; redirecionar para `/dashboard`.

**`/trocar-senha`**
- campos: senha atual, nova senha, confirmação;
- chama `POST /api/auth/trocar-senha/`;
- após sucesso, redirecionar para `/dashboard`.

**`/esqueci-senha`**
- Etapa 1: campo de email → `POST /api/auth/esqueci-senha/` → exibir "Verifique seu e-mail (em dev, o token aparece no console do servidor)";
- Etapa 2: campo de token + nova senha + confirmação → `POST /api/auth/reset-senha/` → ao sucesso redirecionar para `/login`.

**`/cadastro-escola`**
- formulário público com dados da escola (nome, CNPJ) e do Coordenador/Diretor (nome, email, senha, confirmação de senha);
- senha mínima de 8 caracteres (validar no cliente);
- chama `POST /api/auth/cadastro-escola/`;
- em sucesso, salvar tokens e redirecionar para `/dashboard`.

### 7.2. Middleware de proteção de rotas

`middleware.ts` deve:

- bloquear todas as rotas `/dashboard/*` sem JWT válido → redirecionar para `/login`;
- rejeitar `ALUNO` e `RESPONSAVEL` mesmo com JWT válido;
- interceptar respostas 401 em qualquer fetch para disparar renovação de token (`POST /api/auth/refresh/`) ou logout automático.

### 7.3. Layout do Dashboard

- Sidebar fixa/colapsável.
- Logo SkillFlow.
- Links de navegação:
  - Turmas;
  - Atividades;
  - Submissões/Correções;
  - Analytics;
  - Gestão de Alunos;
  - **Professores** — apenas Coordenador;
  - **Responsáveis** — apenas Coordenador.
- Indicador de role no rodapé da sidebar.
- Botão de logout (chama `POST /api/auth/logout/` e limpa estado).

### 7.4. Páginas obrigatórias

**`/dashboard/turmas`**
- `GET /api/saas/turmas/` (lista paginada);
- Professor vê apenas suas turmas; Coordenador vê todas da escola;
- Cards com: nome, escola, qtd alunos, qtd atividades, badge de ranking ativo.

**`/dashboard/turmas/[id]`**
- Tabs:
  - **Alunos** — `GET /api/saas/turmas/{id}/alunos/` com média ponderada de cada aluno;
  - **Atividades** — `GET /api/saas/atividades/?turma_id={id}` separadas por tipo;
  - **Materiais** — `GET /api/saas/turmas/{id}/materiais/` com botão de upload (`POST`, multipart com `titulo` + `arquivo`);
  - **Ranking** — `GET /api/saas/turmas/{id}/ranking/?tipo=pontuacao|provas` (ignora flag de ativo) + `PUT /api/saas/turmas/{id}/ranking/` para ativar/desativar cada tipo.

**`/dashboard/atividades/nova`**
- Formulário: título, disciplina, turma (dropdown das turmas disponíveis), tipo (`EXERCICIO` / `PROVA`);
- campo **peso** visível e obrigatório **somente** quando tipo = `PROVA` (valor inteiro ≥ 1);
- data de liberação e data limite — opcionais enquanto `DRAFT`, obrigatórias ao publicar/agendar;
- seção de exercícios dinâmicos:
  - tipo (MC / Dissertativa);
  - enunciado;
  - gabarito;
  - alternativas A-E visíveis apenas para MC;
- botão **"Gerar com IA"** → dialog para selecionar material existente da turma ou fazer upload de PDF; campo de quantidade → `POST /api/saas/atividades/gerar-ia/` com `{turma_id, material_id, quantidade, titulo, disciplina, tipo_atividade, peso?}` → resposta imediata com `atividade_id` e `status: "PROCESSANDO"` → polling de `GET /api/saas/atividades/?turma_id=` para detectar quando os exercícios aparecerem;
- botão **"Salvar como DRAFT"** → `POST /api/saas/atividades/`;
- botão **"Aprovar e Publicar/Agendar"** → exige data_liberacao + data_limite → `PUT /api/saas/atividades/{id}/aprovar-agendar/`.

**`/dashboard/atividades/[id]`**
- `GET /api/saas/atividades/?turma_id=...` ou store local;
- badge de tipo e peso;
- se `DRAFT`: botões de edição (`PUT /api/saas/atividades/{id}/`) e aprovação;
- se `PUBLICADO` ou `AGENDADO`: lista de alunos da turma com status de submissão, nota calculada e nota final;
- por aluno: botão de **override consolidado** (`PUT /api/saas/atividades/{id}/override-nota-aluno/` com `{aluno_id, nota}`).

**`/dashboard/submissoes`**
- `GET /api/saas/submissoes/?turma_id=&status=`;
- filtros: turma, status, tipo de atividade;
- colunas: aluno, atividade, tipo atividade, exercício, tipo questão, nota calculada, nota final, status;
- badge visual diferenciando `CONFLITO_SYNC` dos demais status;
- clique abre detalhe.

**`/dashboard/submissoes/[id]`**
- `GET /api/saas/submissoes/{id}/`;
- seções:
  - enunciado e gabarito do exercício;
  - resposta do aluno (texto) ou PDF viewer embutido;
  - nota calculada pelo sistema + feedback IA;
  - formulário de **override individual**: campo de nota (0–100) + textarea de feedback → `PUT /api/saas/submissoes/{id}/override-nota/`;
- se `status == "CONFLITO_SYNC"` — painel de **resolução de conflito**:
  - exibir informações do timestamp local e offset do aluno;
  - três botões: "Aceitar", "Rejeitar", "Solicitar Reenvio" → `PUT /api/saas/submissoes/{id}/resolver-conflito/` com `{acao, observacao?}`;
  - após resolução, recarregar a submissão.

**`/dashboard/analytics`**
- `GET /api/saas/turmas/{id}/analytics/`;
- seleção de turma (dropdown);
- filtro por tipo de atividade (todos / exercícios / provas) — filtrar localmente os arrays retornados;
- gráfico de barras: `distribuicao_erros` (classificacao_erro × percentual);
- gráfico por disciplina: `por_disciplina` (disciplina × media_nota);
- tabela "Alunos em Risco": `alunos_risco` (alunos com média < 50).

**`/dashboard/alunos/cadastrar`**
- `POST /api/saas/turmas/{id}/alunos/cadastrar/` com `{nome, email}`;
- turma escolhida por dropdown;
- após cadastro, exibir modal com a `senha_provisoria` retornada.

**`/dashboard/alunos/cadastrar-massa`**
- dropdown de turma destino;
- upload PDF (drag-and-drop) → `POST /api/saas/turmas/{id}/alunos/cadastrar-massa/` multipart com campo `pdf`;
- resposta imediata: `{relatorio_id, status: "PROCESSANDO"}`;
- polling de `GET /api/saas/relatorios-cadastro/{id}/` até `status == "CONCLUIDO"` ou `"ERRO"`;
- exibir relatório: tabela de criados (nome, email, senha) + tabela de falhas (nome, email, motivo);
- botão "Baixar CSV" para exportar resultado.

**`/dashboard/alunos/[id]/historico`**
- apenas Coordenador;
- `GET /api/saas/alunos/{id}/historico/`;
- timeline cross-turma de submissões com turma, atividade, nota e data.

**`/dashboard/professores`**
- apenas Coordenador;
- `GET /api/saas/professores/{id}/turmas/` para listar turmas vinculadas;
- botão "Cadastrar Professor": dialog `{nome, email}` → `POST /api/saas/professores/cadastrar/` → exibir senha provisória;
- botão "Vincular Turma": dropdown de turmas da escola → `POST /api/saas/professores/{id}/vincular-turma/` com `{turma_id}`;
- botão "Desvincular" por turma → `DELETE /api/saas/professores/{id}/desvincular-turma/` com `{turma_id}`.

**`/dashboard/responsaveis`**
- apenas Coordenador;
- `GET /api/saas/responsaveis/` com qtd de filhos;
- botão "Cadastrar Responsável": dialog `{nome, email}` → `POST /api/saas/responsaveis/cadastrar/` → exibir senha provisória;
- clique no responsável abre detalhe com filhos vinculados (`GET /api/saas/responsaveis/{id}/alunos/`);
- botão "Vincular Aluno": busca por nome/email (`GET /api/saas/alunos/?q=`) → `POST /api/saas/responsaveis/{id}/vincular-aluno/` com `{aluno_id}`;
- botão "Desvincular" por aluno → `DELETE /api/saas/responsaveis/{id}/desvincular-aluno/` com `{aluno_id}`.

---

## 8. Mobile Flutter

O mesmo app atende `ALUNO` e `RESPONSAVEL`, com navegação separada por role.

### 8.1. Login e Conta

**Login**
- campos: email + senha;
- `POST /api/auth/login/`;
- verificar campo `role` da resposta:
  - `PROFESSOR` ou `COORDENADOR` → exibir: "Este app não é para docentes. Use a plataforma web." e impedir acesso;
  - `ALUNO` → salvar tokens e navegar para Painel do Aluno;
  - `RESPONSAVEL` → salvar tokens e navegar para Seletor de Filhos (ou Boletim direto se houver só 1 filho);
- se `must_change_password=true` → navegar para Trocar Senha **antes de qualquer outra tela**.

**Trocar Senha**
- campos: senha atual, nova senha, confirmação;
- `POST /api/auth/trocar-senha/`;
- após sucesso, navegar para o destino correto conforme role.

**Esqueci Minha Senha**
- acessível via link na tela de Login;
- etapa 1: campo de email → `POST /api/auth/esqueci-senha/`;
- etapa 2: campo de token + nova senha → `POST /api/auth/reset-senha/` → ao sucesso, redirecionar para Login.

### 8.2. Telas do Aluno

**Painel do Aluno (tela inicial)**

Consome `GET /api/app/painel/`. Exibir:

- card grande: `media_geral_ponderada` (verde > 70, amarelo 50–70, vermelho < 50);
- gráfico de barras: `progresso_por_disciplina` (disciplina × media);
- gráfico de linha: `historico_notas` (data × nota);
- resumo: `atividades_pendentes`, `atividades_em_andamento`, `atividades_concluidas`;
- botões de atalho: "Ver Atividades" e "Ver Ranking";
- pull-to-refresh.

**Lista de Atividades**

Consome `GET /api/app/atividades/?tipo=`. Exibir:

- cards com título, disciplina, `data_limite`, badge de tipo (`EXERCICIO` / `PROVA` com cores diferentes), badge de status (nova / em andamento / concluída);
- filtro por tipo (Todos / Exercícios / Provas);
- ícone de offline e badge de "X respostas pendentes" na AppBar (via SQLite local);
- pull-to-refresh para sincronizar dados.

**Detalhe da Atividade**

Consome `GET /api/app/atividades/{id}/exercicios/`. Exibir:

- lista de exercícios com enunciado, status e nota (quando disponível);
- exibir peso quando `tipo_atividade == "PROVA"`.

**Responder MC**

- enunciado + alternativas como RadioListTiles;
- botão "Enviar Resposta" → `POST /api/app/submissoes/` (multipart, campo `exercicio_id` + `resposta_texto`);
- feedback imediato a partir de `correto` e `feedback_ia` na resposta.

**Responder Dissertativa**

- enunciado;
- dois modos: "Escanear Resolução" (câmera + recorte + geração de PDF) e "Anexar PDF" (`file_picker` filtrado para `.pdf`);
- preview do arquivo;
- botão "Enviar" → `POST /api/app/submissoes/` (multipart, campos `exercicio_id` + `pdf`);
- se offline: salvar no SQLite com `timestamp_local`, `client_server_offset_ms`, `server_time_snapshot` e `atividade_updated_at_snapshot`; mostrar "Aguardando conexão...";
- se online: mostrar "Correção em processamento...".

**Resultado**

Consome `GET /api/app/submissoes/{id}/resultado/`. Exibir:

- nota final com indicador visual (barra colorida);
- `feedback_final` (usa `feedback_professor` se existir, senão `feedback_ia`);
- status legível ("Corrigida" / "Revisada pelo professor" / "Aguardando correção..." / "Envio em análise");
- botão "Chat com Tutor" **visível apenas** quando `status in {"CORRIGIDA", "REVISADA_PROFESSOR"}`.

**Chat Tutor**

Consome `POST /api/app/submissoes/{id}/chat/`. Exibir:

- lista de mensagens anteriores (campo `mensagens` do response);
- input desabilitado quando `contador_mensagens_aluno >= 3` (comparar com campo `limite = 3`);
- contador visual: `X/3 perguntas utilizadas`;
- exibir mensagem explicativa quando limite atingido.

**Ranking**

Consome `GET /api/app/turma/ranking/?tipo=pontuacao|provas`. Exibir:

- 2 tabs: "Pontuação" e "Provas";
- verificar campo `ativo`:
  - `false` → exibir `mensagem` no lugar da lista;
  - `true` → lista ordenada por `posicao` com nome e `pontuacao`; destaque visual para o aluno logado (comparar `aluno_id` com `usuario_id` do token);
- pull-to-refresh.

### 8.3. Telas do Responsável

**Seletor de Filhos**

Consome `GET /api/app/responsavel/filhos/`. Exibir:

- se apenas 1 filho → navegar diretamente para o boletim;
- se múltiplos → lista de cards com nome, turma_nome, escola_nome; tap navega para boletim.

**Boletim do Filho**

Consome `GET /api/app/responsavel/filhos/{aluno_id}/boletim/?disciplina=`. Exibir:

- card com `media_geral_ponderada`;
- seção **Provas**: lista com título, disciplina, peso, nota, data (`data` do item);
- seção **Exercícios**: lista com título, disciplina, nota, data;
- dropdown de filtro por disciplina (adicionar `?disciplina=` na query);
- interface read-only: sem chat, sem ranking, sem submissão.

---

## 9. Offline-First no Flutter

Implemente SQLite para alunos (responsáveis não precisam de offline).

### Modelos locais

```dart
// Espelham os campos necessários para leitura offline e validação de prazo.
AtividadeLocal   { id, titulo, disciplina, tipo, peso, status, dataLiberacao, dataLimite, updatedAt }
ExercicioLocal   { id, atividadeId, ordem, tipo, enunciado, alternativas }
SubmissaoLocal   { id, exercicioId, respostaTexto, pdfPath, sincronizado, timestampLocal,
                   serverTimeSnapshot, clientServerOffsetMs, atividadeUpdatedAtSnapshot, statusConflito }
```

### SyncService

Ao detectar conectividade (via `connectivity_plus`):

1. `GET /api/app/sync/server-time/` → calcular `client_server_offset_ms = epoch_ms_local - epoch_ms_servidor`;
2. `GET /api/app/atividades/` → salvar/atualizar registros no SQLite com `updatedAt` e `serverTimeSnapshot`;
3. `GET /api/app/atividades/{id}/exercicios/` para cada atividade nova ou atualizada;
4. enviar todas as `SubmissaoLocal` com `sincronizado = false` para `POST /api/app/submissoes/`, incluindo os campos de offset;
5. verificar campo `status` da resposta:
   - `"CONFLITO_SYNC"` → marcar local como `statusConflito = true` e exibir "Envio em análise" (não tentar reenviar automaticamente);
   - qualquer outro → marcar `sincronizado = true`.

### Indicadores visuais

- ícone de nuvem com badge na AppBar quando houver submissões pendentes;
- texto "Offline" quando sem conexão;
- texto "Envio em análise" para submissões em conflito.

---

## 10. Push Notifications

Implemente Firebase Cloud Messaging apenas para alunos.

- após login com `role == "ALUNO"`, obter token FCM e registrar via `POST /api/app/device-token/` com `{token}`;
- **não registrar token para Responsável** (API retorna 403);
- ao receber notificação de correção concluída, navegar para a tela de Resultado da submissão correspondente.

---

## 11. Estados de UI Obrigatórios

Toda tela com dados remotos deve ter:

- loading (skeleton ou spinner);
- erro com botão "Tentar novamente";
- vazio (empty state descritivo);
- sucesso.

Interceptar `401` globalmente para exibir "Sessão expirada" e navegar para login.

Uploads devem ter:

- validação de extensão `.pdf` no cliente antes do envio;
- limite visível (10 MB para submissões/cadastro em massa, 50 MB para materiais);
- indicador de progresso ou estado "Processando...";
- mensagem de erro amigável para arquivos rejeitados.

---

## 12. Testes

### Frontend Web (Jest + Testing Library)

- landing renderiza hero, features, CTA e seção Como Funciona;
- `/cadastro-escola` submete formulário e redireciona para dashboard;
- login rejeita `ALUNO` e `RESPONSAVEL`;
- login docente com `must_change_password=true` redireciona para `/trocar-senha`;
- login docente bem-sucedido redireciona para `/dashboard`;
- sidebar exibe link "Professores" e "Responsáveis" apenas para Coordenador;
- criação de atividade exibe campo peso apenas quando tipo = `PROVA`;
- detalhe de atividade exibe botão de override de nota por aluno;
- detalhe de submissão com `CONFLITO_SYNC` exibe painel de resolução com 3 ações;
- `dashboard/turmas` renderiza cards;
- `dashboard/turmas/[id]` contém tab Ranking;
- analytics renderiza gráficos;
- responsáveis aparece no menu apenas para Coordenador.

### Mobile (flutter_test)

- login aluno navega para painel;
- login responsável navega para seletor de filhos;
- login professor/coordenador exibe mensagem de rejeição;
- login com `must_change_password=true` navega para trocar senha;
- painel renderiza média geral, progresso por disciplina e resumo de atividades;
- lista de atividades renderiza filtro por tipo;
- MC permite selecionar alternativa e enviar;
- dissertativa exibe opções câmera e anexar PDF;
- chat bloqueia input após `contador_mensagens_aluno >= 3`;
- ranking com `ativo: false` exibe mensagem;
- seletor de filhos com filho único navega direto para boletim;
- boletim separa seção Provas de seção Exercícios;
- SyncService calcula `client_server_offset_ms` corretamente;
- submissão offline salva `timestamp_local` e envia ao reconectar;
- submissão com resposta `CONFLITO_SYNC` marca local como "Envio em análise".

---

## 13. Critérios de Pronto

Frontend/Mobile estão prontos quando:

- Landing Page está completa, responsiva e com SEO básico.
- Web SaaS implementa os fluxos principais de professor e coordenador, incluindo resolução de conflito e override de nota consolidada.
- App Flutter implementa fluxos de aluno e responsável.
- Autenticação por role funciona nas duas interfaces, incluindo bloqueio por `must_change_password`.
- App suporta leitura offline de atividades com SQLite.
- App cria fila local de submissões offline com metadados de offset.
- UI diferencia exercício e prova (badge, campo peso, filtros).
- Ranking, boletim, painel do aluno e analytics estão implementados.
- Estados de loading, erro e vazio existem nas telas críticas.
- Testes principais passam.
- README explica:
  - como configurar `NEXT_PUBLIC_API_URL` e `MOBILE_API_URL` para dev e prod;
  - como rodar web (`npm run dev`) e mobile (`flutter run`);
  - como executar testes de cada plataforma;
  - como apontar Web e Mobile para a API pública hospedada no Coolify.
