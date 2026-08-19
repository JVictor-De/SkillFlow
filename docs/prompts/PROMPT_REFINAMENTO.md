# PROMPT DE REFINAMENTO FINAL — SKILLFLOW
# QA, Integração, Segurança, Polimento e Entrega

> Use este prompt depois que API, Frontend Web e Mobile já tiverem uma primeira versão implementada.
>
> Documentos obrigatórios de referência:
> 1. `PRD.md` — validação funcional e regras de negócio.
> 2. `TechSpecs.md` — validação técnica, endpoints, banco e arquitetura.
> 3. `DESIGN_GUIDELINES.md` — qualidade visual e experiência de uso.
> 4. `PROMPT_IMPLEMENTACAO.md` — escopo completo original.
> 5. `PROMPT_API.md` — checklist específico da API.
> 6. `PROMPT_FRONTEND_MOBILE.md` — checklist específico das interfaces.
> 7. `PROMPT_INFRA_ENTREGA.md` — checklist específico de Docker, Coolify, ambientes, setup, logs e entrega.
> 8. `desafio_software_engineer.md` — critérios de avaliação.
>
> Objetivo: transformar uma implementação funcional em uma entrega bem apresentada, coerente, testada e demonstrável.
>
> Hierarquia de revisão: `TechSpecs.md` para contratos técnicos, `PRD.md` para regras de negócio, `DESIGN_GUIDELINES.md` para UX/UI e os prompts específicos para escopo de execução.

---

## 1. Papel do Agente

Atue como engenheiro sênior fazendo revisão final de produto e engenharia.

Priorize:

1. bugs funcionais;
2. inconsistências entre PRD, TechSpecs e implementação;
3. falhas de permissão e escopo multi-tenant;
4. problemas de autenticação;
5. fluxos quebrados entre API, Web e Mobile;
6. estados de UI ausentes;
7. testes importantes faltando;
8. polimento visual e UX;
9. documentação e apresentação.

Não introduza grandes refactors sem necessidade. Refine o que já existe para deixar a entrega consistente.

---

## 2. Checklist de Escopo

Confirme que o SkillFlow entrega:

- Landing Page pública com CTA, SEO e explicação do ecossistema.
- Auto-cadastro público de Escola + Coordenador/Diretor.
- Login unificado com JWT.
- Web SaaS para Professor e Coordenador.
- App Flutter para Aluno e Responsável.
- PostgreSQL como banco relacional.
- API Django Ninja.
- Celery/Redis para tarefas assíncronas.
- Correção MC síncrona.
- Correção dissertativa assíncrona.
- Upload seguro de PDFs.
- Criação de atividades manual e por IA mockada.
- Cadastro em massa por PDF mockado.
- Offline-first no app do aluno.
- Painel do aluno.
- Ranking por pontuação e provas.
- Boletim do responsável.
- Analytics de turma.
- Override de notas.
- Seed de dados.
- Docker Compose.
- `.env.example`, Dockerfiles, comandos de setup, logs e deploy Coolify conforme `PROMPT_INFRA_ENTREGA.md`.
- Testes automatizados.
- README e roteiro de demonstração.

---

## 3. Auditoria de Regras de Negócio

Revise a implementação contra as regras abaixo.

### Roles

- auto-cadastro público cria `Escola + COORDENADOR` no mesmo fluxo.
- `ALUNO` acessa somente `/api/app/*`, exceto rotas de responsável.
- `RESPONSAVEL` acessa somente `/api/app/responsavel/*`.
- `PROFESSOR` acessa somente `/api/saas/*` e apenas suas turmas.
- `COORDENADOR` acessa `/api/saas/*` apenas dentro da sua escola.
- `ADMIN` atua via Django Admin.

### Multi-tenant

- Coordenador nunca vê dados de outra escola.
- Professor nunca vê turma sem vínculo em `ProfessorTurma`.
- Responsável nunca vê aluno sem vínculo em `ResponsavelAluno`.
- Aluno nunca acessa atividade de outra turma.

### Atividades

- `EXERCICIO` sempre tem peso `1`.
- `PROVA` exige peso `>= 1`.
- `DRAFT` pode ficar sem datas.
- `AGENDADO` e `PUBLICADO` exigem `data_liberacao` e `data_limite`.
- App só lista atividades `PUBLICADO` e liberadas por `data_liberacao <= now`.
- Atividade publicada com submissões não pode ser excluída.

### Submissões

- MC corrige instantaneamente.
- Dissertativa cria submissão pendente e enfileira task.
- Submissão duplicada por aluno/exercício retorna conflito.
- Submissão online fora do prazo é rejeitada.
- Submissão offline com metadados incoerentes vira `CONFLITO_SYNC`.
- Override altera nota final e registra auditoria.

### Chat

- Só abre depois de `CORRIGIDA` ou `REVISADA_PROFESSOR`.
- Limite máximo de 3 mensagens do aluno.
- Quarta mensagem retorna 403.

### Responsáveis

- Coordenador cadastra responsáveis.
- Coordenador vincula responsável a aluno da mesma escola.
- Responsável vê boletim read-only.
- Responsável não acessa chat, ranking, submissões ou push notifications.

---

## 4. Auditoria Técnica da API

Verifique:

- migrations limpas e reproduzíveis;
- constraints e índices coerentes com `TechSpecs.md`;
- serializers/schemas validam inputs;
- respostas de erro são consistentes;
- endpoints de lista são paginados;
- tokens JWT e refresh funcionam;
- logout invalida refresh token;
- reset de senha usa token de uso único;
- uploads validam extensão, MIME, magic bytes e tamanho;
- tasks Celery são idempotentes quando possível;
- Celery Beat publica atividades agendadas;
- logs não expõem senha, token, PDF sensível ou chave de API;
- LLM mock retorna formato consistente;
- prompts tratam conteúdo de usuário/PDF como não confiável.

### Teste manual mínimo da API

Execute ou simule:

1. chamar `POST /api/auth/cadastro-escola/` para criar escola + coordenador;
2. preparar turma base da escola (seed/script de apoio, quando necessário);
3. login coordenador;
4. cadastrar professor;
5. vincular professor a turma;
6. login professor;
7. criar atividade `EXERCICIO`;
8. criar atividade `PROVA`;
9. aprovar/publicar atividade;
10. login aluno;
11. listar atividades;
12. enviar MC;
13. enviar dissertativa;
14. processar task;
15. fazer override;
16. abrir chat;
17. login responsável;
18. consultar boletim.

### Auditoria de Infra e Entrega

Verifique também `PROMPT_INFRA_ENTREGA.md`:

- `docker-compose.yml` sobe backend, frontend, PostgreSQL, Redis, Celery Worker e Celery Beat;
- deploy Coolify está documentado e usa domínios públicos HTTPS para frontend e API;
- Dockerfiles de backend e frontend existem e são reproduzíveis;
- `.env.example` cobre backend, frontend, banco, Redis, Celery, LLM mock, uploads, mobile e variáveis públicas de produção;
- variáveis de produção estão mapeadas para o painel do Coolify, sem depender de `.env` commitado;
- variáveis mobile documentam Android emulator, iOS simulator e dispositivo físico;
- variáveis mobile documentam também a API pública do Coolify;
- comandos de setup do zero estão no README;
- comandos de migrations e seed no Coolify estão documentados;
- comandos de migration, seed, testes e logs estão documentados;
- `GET /api/health/` ou healthcheck equivalente existe;
- healthcheck público no Coolify aponta para `/api/health/`;
- logs cobrem autenticação, uploads, tasks, conflitos offline e overrides sem expor segredos;
- volumes de banco e mídia estão configurados;
- PostgreSQL e Redis não ficam expostos publicamente no Coolify;
- troubleshooting cobre portas ocupadas, CORS, Redis/Celery, acesso do Flutter ao backend, domínio HTTPS e variáveis incorretas no Coolify.

---

## 5. Auditoria Frontend Web

Verifique:

- Landing Page comunica valor em menos de 10 segundos.
- CTA aparece no topo e no final.
- SEO básico está implementado.
- Login bloqueia aluno/responsável na Web.
- Middleware protege `/dashboard/*`.
- Sidebar muda conforme role.
- Professor não vê telas exclusivas de coordenador.
- Coordenador vê responsáveis e professores.
- Tabelas têm loading, vazio, erro e paginação.
- Formulários mostram validação antes de enviar.
- Uploads têm feedback visual.
- Criar prova exibe campo peso obrigatório.
- Criar exercício não permite peso customizado.
- Analytics mostra gráficos compreensíveis.
- Override de nota deixa claro o valor final.
- Ranking mostra ativo/inativo.
- Layout é responsivo.
- Tema segue `DESIGN_GUIDELINES.md`.

### Polimento visual

- Harmonizar espaçamentos.
- Padronizar cards, badges e botões.
- Ajustar contraste.
- Verificar foco de teclado.
- Evitar tabelas estourando em telas menores.
- Melhorar skeleton loaders.
- Revisar textos vazios e mensagens de erro.

---

## 6. Auditoria Mobile Flutter

Verifique:

- Login aceita aluno e responsável.
- Login rejeita professor/coordenador.
- Troca obrigatória de senha bloqueia navegação.
- Aluno abre no painel individual.
- Responsável abre no seletor de filhos ou boletim.
- Atividades funcionam offline após sincronização.
- Fila local de submissões persiste após fechar app.
- Sync envia metadados offline completos.
- Conflitos aparecem como "Envio em análise".
- Responsável não vê recursos de aluno.
- Chat bloqueia antes da correção e após 3 mensagens.
- Ranking trata ativo e inativo.
- Push notification é registrada apenas para aluno.
- PDF/scan tem preview antes do envio.
- Estados de loading/erro/vazio existem.

### Polimento mobile

- Alvos de toque confortáveis.
- Texto legível.
- Feedback claro após envio.
- Indicação offline discreta e persistente.
- Navegação sem becos sem saída.
- Pull-to-refresh nas telas principais.
- Empty states didáticos.

---

## 7. Integração End-to-End

Execute um fluxo completo:

1. Coordenador/Diretor faz auto-cadastro da escola no fluxo público.
2. Coordenador cria professor.
3. Coordenador vincula professor à turma.
4. Professor cria aluno.
5. Professor cria atividade com MC e dissertativa.
6. Professor publica atividade.
7. Aluno faz login no app.
8. Aluno sincroniza atividades.
9. Aluno responde MC.
10. Aluno envia PDF dissertativo.
11. Worker corrige.
12. Aluno vê resultado.
13. Aluno usa chat.
14. Professor faz override.
15. Aluno vê nota final alterada.
16. Coordenador cadastra responsável.
17. Responsável consulta boletim.
18. Dashboard analytics reflete dados.
19. Ranking aparece conforme configuração da turma.

Documente qualquer falha encontrada e corrija em ordem de severidade.

---

## 8. Testes e Cobertura

### Backend

Rode:

```bash
pytest
```

Priorize cobertura para:

- permissões;
- escopo por escola;
- submissão offline;
- cálculo de média ponderada;
- override;
- chat;
- ranking;
- responsáveis;
- cadastro em massa;
- tasks Celery.

### Frontend

Rode:

```bash
npm test
npm run lint
npm run build
```

Priorize:

- autenticação;
- role-based rendering;
- formulários críticos;
- criação de atividade;
- override;
- analytics;
- responsáveis.

### Mobile

Rode:

```bash
flutter test
flutter analyze
```

Priorize:

- auth por role;
- SyncService;
- submissão offline;
- telas de aluno;
- telas de responsável;
- chat;
- ranking.

---

## 9. Segurança

Revise:

- ausência de secrets no repositório;
- `.env.example` sem valores reais;
- CORS restrito;
- DEBUG desligável por variável;
- validação de uploads;
- logs sem dados sensíveis;
- proteção contra prompt injection;
- autenticação nas rotas;
- autorização no objeto acessado;
- tokens armazenados com cuidado;
- rate limit ou mitigação simples em login/reset/chat, se viável;
- tratamento seguro de erros 500.

---

## 10. Performance e Robustez

Verifique:

- queries com `select_related` e `prefetch_related`;
- índices em queries frequentes;
- paginação em listas;
- evitar N+1 em dashboards;
- upload não bloqueia request além do necessário;
- tasks longas ficam no Celery;
- app não baixa dados desnecessários;
- cache local mobile não cresce sem controle;
- imagens e assets web otimizados;
- build Next.js sem warnings importantes.

---

## 11. Documentação Final

Atualize `README.md` com:

- descrição do produto;
- stack;
- arquitetura em Mermaid;
- instruções de setup;
- variáveis de ambiente;
- `docker-compose up`;
- como rodar migrations;
- como rodar seed;
- credenciais de teste;
- como rodar backend;
- como rodar frontend;
- como rodar mobile;
- como rodar testes;
- endpoints principais;
- limitações conhecidas;
- decisões técnicas importantes.

Crie também uma seção de demonstração:

```text
Roteiro demo:
1. Landing Page
2. Cadastro da Escola + Coordenador
3. Gestão de professores/responsáveis
4. Login Professor
5. Criar atividade
6. Login Aluno no App
7. Resolver atividade
8. Correção e feedback
9. Boletim do Responsável
10. Analytics e ranking
```

---

## 12. Critérios do Desafio Técnico

Valide explicitamente:

- Projeto end-to-end está estruturado.
- Uso de LLMs está documentado.
- Decisões de produto estão claras.
- Entrega é funcional.
- Landing Page tem proposta de valor e CTA.
- SaaS tem autenticação e funcionalidade relevante.
- Backend usa Django + Django Ninja.
- Banco usa PostgreSQL.
- Mobile Flutter tem offline-first e sync.
- Arquitetura está documentada.
- Testes básicos existem.
- Docker/infra local funciona.
- Apresentação é clara.

---

## 13. Prioridade de Correção

Se houver muitos problemas, corrija nesta ordem:

1. aplicação não sobe;
2. migrations quebradas;
3. login/autenticação quebrados;
4. permissões e vazamento multi-tenant;
5. fluxo principal professor → aluno → correção → responsável;
6. submissões e notas;
7. offline-first;
8. testes quebrados;
9. UX crítica;
10. visual e documentação.

---

## 14. Entrega Esperada

Ao terminar o refinamento, entregue:

- lista objetiva de correções feitas;
- comandos de validação executados;
- testes que passaram;
- pendências conhecidas, se existirem;
- roteiro final de demonstração;
- riscos remanescentes.

Evite expandir escopo. O foco é deixar o projeto coerente, apresentável e confiável para avaliação.
