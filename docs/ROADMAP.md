# 🗺️ Roadmap — SkillFlow

> Este documento descreve a visão de evolução do SkillFlow além do MVP.
> Cada fase pressupõe que a anterior esteja estável em produção.
> Prioridades podem mudar conforme feedback de clientes reais.

---

## Fase 0 — MVP (Atual)

**Status:** Em desenvolvimento
**Objetivo:** Entregar a plataforma funcional completa para demonstração e primeiros clientes piloto.

| Funcionalidade | Status |
|---|---|
| Backend Django + Django Ninja + Celery | 🔲 |
| Autenticação JWT com senha provisória | 🔲 |
| CRUD de Escolas, Turmas, Professores, Alunos | 🔲 |
| Criação de Atividades (Exercício/Prova) com peso | 🔲 |
| Correção automática MC (síncrona) | 🔲 |
| Correção de Dissertativas via IA/OCR (assíncrona) | 🔲 |
| Geração de exercícios via RAG (assíncrona) | 🔲 |
| Cadastro em massa de alunos via PDF+IA | 🔲 |
| Chat Tutor com limite de 3 mensagens | 🔲 |
| Override de notas (individual e consolidado) | 🔲 |
| Dashboard Analytics para professores | 🔲 |
| Painel de progresso do aluno (mobile) | 🔲 |
| Ranking dual (Pontuação + Provas) | 🔲 |
| Responsáveis com boletim read-only | 🔲 |
| App Flutter offline-first com sync | 🔲 |
| Landing Page Next.js | 🔲 |
| Plataforma Web SaaS (Next.js) | 🔲 |
| Drip Content (agendamento via Celery Beat) | 🔲 |
| Docker Compose + Deploy Coolify | 🔲 |
| Auto-cadastro de Escola + Coordenador (público) | 🔲 |

**Limitações conhecidas do MVP:**
- Sem integração de pagamento
- Sem notificações por email (tokens logados no console)
- Sem conceito de "Mantenedora" / rede de ensino
- IA usa mock em desenvolvimento; requer API key real para produção
- Sem versionamento de atividades
- Sem relatórios exportáveis (PDF/Excel)

---

## Fase 1 — Estabilização e Operação (1-2 meses pós-MVP)

**Objetivo:** Tornar o sistema confiável para operação diária com clientes reais.

### 1.1. Notificações por Email
- Integrar serviço de email transacional (SendGrid, Resend ou AWS SES)
- Envio real de tokens de reset de senha
- Notificação por email ao coordenador quando cadastro em massa concluir
- Template de boas-vindas para novos usuários com credenciais provisórias

### 1.2. Observabilidade e Monitoramento
- Integrar Sentry para captura de erros em backend, frontend e mobile
- Dashboards de monitoramento (Grafana + Prometheus ou similar)
- Alertas automáticos para falhas de Celery tasks
- Métricas de latência de API e taxa de erro

### 1.3. Backup e Recuperação
- Backup automatizado do PostgreSQL (pg_dump diário)
- Backup de mídia (PDFs de submissões e materiais)
- Rotina de teste de restore documentada
- Política de retenção de dados

### 1.4. Segurança em Produção
- Rate limiting na API (throttling por IP e por usuário)
- Antivírus/sandbox para PDFs enviados por alunos
- Auditoria de acessos sensíveis (log de quem fez override, quem acessou dados de alunos)
- Política de expiração de refresh tokens
- HTTPS forçado em todas as rotas

---

## Fase 2 — Self-Service e Monetização (3-4 meses pós-MVP)

**Objetivo:** Evoluir aquisição e iniciar a geração de receita.

### 2.1. Onboarding Self-Service Avançado
- Evoluir o fluxo público de cadastro já existente
- Verificação de email obrigatória com ativação de conta
- Anti-abuso no cadastro (rate limit, deduplicação e validações extras)
- Wizard de primeiro uso: criar turma, convidar professor, cadastrar alunos

### 2.2. Gestão de Planos e Assinaturas
- Integração com gateway de pagamento (Stripe ou Asaas para o Brasil)
- Planos: Gratuito (1 turma, 30 alunos), Básico, Premium
- Limites por plano: quantidade de turmas, alunos, correções IA/mês
- Dashboard de billing para o coordenador
- Emissão de Notas Fiscais via integração (Nuvem Fiscal ou similar)

### 2.3. Entidade Mantenedora (Redes de Ensino)
- Novo model `Mantenedora` com CNPJ, razão social e dados fiscais
- `Escola` passa a ter FK para `Mantenedora` (nullable para escolas independentes)
- Role `DIRETOR_REDE` com visão cross-escola dentro da mantenedora
- Faturamento consolidado por mantenedora
- Dashboard comparativo entre unidades da rede

### 2.4. Painel Administrativo Interno
- Substituir o Django Admin por painel interno dedicado
- Gestão de clientes, planos, uso e métricas de churn
- Suporte técnico com visualização read-only de dados do cliente
- Ferramentas de migração e merge de escolas

---

## Fase 3 — Experiência Premium (5-8 meses pós-MVP)

**Objetivo:** Elevar a experiência do aluno e do professor a nível premium.

### 3.1. Gamificação Avançada
- Sistema de XP e níveis para alunos
- Conquistas/badges desbloqueáveis (ex: "5 provas seguidas acima de 80")
- Streaks de estudo (dias consecutivos com submissão)
- Ranking semanal/mensal além do acumulado

### 3.2. Relatórios Avançados e Exportação
- Exportação de boletim em PDF (para responsáveis e coordenadores)
- Exportação de analytics em Excel/CSV
- Relatório de desempenho por disciplina ao longo do tempo
- Relatório de engajamento (frequência de uso do app por aluno)

### 3.3. Notificações Push Avançadas
- Push para responsáveis quando nota do filho for publicada
- Push para professores quando todas as submissões de uma atividade forem entregues
- Lembretes automáticos de prazo para alunos (24h antes do vencimento)
- Central de notificações in-app com histórico

### 3.4. Chat Tutor Evoluído
- Aumentar limite de mensagens por exercício (configurável por plano)
- Histórico de chats consultável pelo professor
- Métricas de uso do chat tutor nos analytics
- Suporte a imagens nas respostas do tutor (diagramas, gráficos)

### 3.5. Modo de Revisão / Simulado
- Aluno pode refazer exercícios já corrigidos como revisão (sem alterar nota)
- Modo simulado com timer configurável pelo professor
- Banco de questões reutilizáveis entre atividades

---

## Fase 4 — Escala e Inteligência (9-12 meses pós-MVP)

**Objetivo:** Escalar a infraestrutura e usar dados acumulados para insights inteligentes.

### 4.1. Infraestrutura para Escala
- Migrar storage de mídia para S3 (ou compatível)
- CDN para assets estáticos e PDFs
- Réplicas de leitura do PostgreSQL
- Autoscaling de Celery workers por demanda
- Cache Redis para endpoints de leitura pesada (analytics, rankings)

### 4.2. IA Personalizada
- Modelo de dificuldade adaptativa: sugerir exercícios com base nos erros anteriores do aluno
- Detecção automática de padrões de cola/fraude (similaridade entre submissões)
- Resumo automático de desempenho da turma para o professor (gerado por IA)
- Fine-tuning de modelos para o contexto educacional brasileiro

### 4.3. Integrações Externas
- Integração com Google Classroom / Microsoft Teams for Education
- SSO via Google/Microsoft para escolas que já usam esses serviços
- API pública documentada para integrações de terceiros
- Webhooks para eventos do sistema (nova submissão, correção concluída)

### 4.4. Internacionalização (i18n)
- Suporte a múltiplos idiomas (pt-BR, en-US, es)
- Tradução da interface web e mobile
- Prompts de IA adaptados por idioma
- Suporte a fusos horários por escola

---

## Fase 5 — Expansão de Mercado (12+ meses)

### 5.1. Novos Segmentos
- Ensino Fundamental (adaptar faixa etária e complexidade)
- Cursos preparatórios (vestibular, ENEM, concursos)
- Educação corporativa (treinamentos internos)

### 5.2. Marketplace de Conteúdo
- Professores compartilham/vendem bancos de questões
- Materiais de apoio curados por disciplina
- Templates de atividades prontos para uso

### 5.3. App para Professores
- App mobile dedicado para professores (hoje é web-only)
- Correção rápida de submissões no celular
- Push notifications para professores

---

## Legenda

| Símbolo | Significado |
|---|---|
| 🔲 | Não iniciado |
| 🔄 | Em desenvolvimento |
| ✅ | Concluído |
| ⏸️ | Pausado |

---

> **Nota:** Este roadmap é um guia estratégico, não um compromisso de entrega.
> Cada fase deve ser precedida por validação com clientes reais e análise de viabilidade técnica.
> O foco deve sempre ser: resolver problemas reais de professores e alunos antes de adicionar complexidade.
