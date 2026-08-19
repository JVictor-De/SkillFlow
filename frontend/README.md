# SkillFlow · Frontend Web (Next.js)

Frontend do **SkillFlow**: Landing Page pública e plataforma SaaS para
**Professores e Coordenadores**. Implementado em Next.js 14 (App Router),
TypeScript strict, TailwindCSS e componentes inspirados no Shadcn/ui.

> Alunos e responsáveis usam o aplicativo Flutter localizado em `../mobile/`.

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- API SkillFlow rodando em `http://localhost:8000` (opcional — por padrão
  o frontend usa mocks locais)

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e ajuste se necessário:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=true
```

- `NEXT_PUBLIC_API_URL` é a URL pública da API. Em produção (Coolify) use
  algo como `https://api.seu-dominio.com`. **Nunca** deixe `localhost` em
  produção.
- `NEXT_PUBLIC_USE_MOCKS=true` habilita o sistema de mocks do frontend, o
  que permite navegar pelo dashboard sem precisar do backend rodando.
  Defina `false` para consumir a API real.

## Como rodar localmente

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

### Credenciais para o modo mock

| Papel        | E-mail                           | Senha (qualquer 4+ caracteres) |
|--------------|----------------------------------|--------------------------------|
| Coordenador  | `coordenador@skillflow.dev`      | `qualquer`                     |
| Professor    | `professor@skillflow.dev`        | `qualquer`                     |
| Pendente     | `novato@skillflow.dev`           | `qualquer` (force change pwd)  |

A landing está em `/`, o cadastro público em `/cadastro-escola`, e o
dashboard em `/dashboard/*`.

## Apontando para a API hospedada no Coolify

Em produção, o `frontend` é publicado em `https://app.seu-dominio.com` e a
API em `https://api.seu-dominio.com`. Configure as variáveis no Coolify:

```bash
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
NEXT_PUBLIC_USE_MOCKS=false
```

Pré-requisitos no backend:

- `ALLOWED_HOSTS` inclui `api.seu-dominio.com`
- `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` incluem
  `https://app.seu-dominio.com`
- HTTPS habilitado nos dois domínios

## Build de produção

```bash
npm run build
npm start
```

## Testes

A suíte cobre as principais regras de negócio:

```bash
npm test
```

Casos cobertos: landing renderiza hero/features/CTA, cadastro-escola cria
escola e redireciona, login rejeita aluno/responsável, login docente
redireciona para dashboard, must change password redireciona, sidebar
mostra links conforme role, criação de atividade mostra peso só para
prova, dashboard de turmas renderiza cards, ranking aparece em detalhe da
turma, analytics renderiza gráficos, submissão permite override e
responsáveis só aparecem para coordenador.

## Estrutura

```
frontend/
├── src/
│   ├── app/            # rotas do App Router
│   ├── components/     # componentes UI compartilhados (Shadcn-like)
│   ├── features/       # composições por domínio (auth, atividades, etc.)
│   ├── hooks/          # hooks reutilizáveis (use-async, use-session)
│   ├── lib/            # API client, mocks e utilidades
│   ├── types/          # tipos compartilhados
│   └── middleware.ts   # proteção das rotas /dashboard/*
├── __tests__/          # testes Jest + Testing Library
└── tailwind.config.ts
```

## Observações de segurança

- Tokens JWT são salvos em `localStorage` e um cookie `session_hint` é
  usado apenas para o middleware redirecionar usuários não autenticados.
  Nenhum dado sensível trafega via cookie.
- O middleware faz redirecionamento "fail closed" — qualquer rota
  `/dashboard/*` sem cookie hint cai em `/login`.
- Mensagens de erro 4xx/5xx são padronizadas em `lib/errors.ts`.
