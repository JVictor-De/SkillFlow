# Product Requirements Document (PRD)
## SkillFlow — Plataforma de Resolução de Exercícios com Correção Automática (Ensino Médio)

---

## 1. Visão Geral
A plataforma é um sistema educacional B2B focado no Ensino Médio, projetado para facilitar a criação, resolução e correção de exercícios. O diferencial é o uso de IA como motor analítico: a IA gera exercícios a partir de materiais (RAG), corrige anexos extraídos em PDF via OCR, analisa padrões recorrentes de dificuldade (Analytics) e atua como tutor (Chat).

O sistema suporta **auto-cadastro de escola** no fluxo público (Coordenador/Diretor cria a escola e a própria conta no mesmo processo). Em desenvolvimento, também utiliza dados mocados via scripts/seed para facilitar testes. A plataforma opera em três interfaces:
- **Landing Page (Next.js — rota pública):** Página institucional de apresentação do produto para visitantes, com proposta de valor, CTA e SEO.
- **App Mobile (Flutter):** Interface para **Alunos e Responsáveis**, com experiência diferenciada por role. Alunos têm suporte offline-first para resolução de atividades; responsáveis têm acesso somente leitura ao boletim dos filhos.
- **Plataforma Web SaaS (Next.js — rotas autenticadas):** Dashboard gerencial e operacional para Professores e Coordenadores.

---

## 2. Atores e Permissões do Sistema

- **Aluno:** Acessa somente o App (Flutter). Pertence a uma única turma (e consequentemente a uma única escola, inferida pela turma). Responde questões no app, anexa PDFs para resoluções dissertativas, recebe correções, interage limitadamente via chat com o tutor virtual e visualiza suas métricas (notas de `0 a 100`). Possui um **painel de progresso individual** com dashboard consolidado de desempenho.
- **Professor:** Acessa a Web SaaS. Cria atividades e exercícios (atribuindo disciplina/matéria e prazos), coordena a publicação (Draft e Agendamentos), revisa dados de correção, efetua override de avaliações se necessário, cadastra novos alunos **dentro das suas próprias turmas**, pode **ativar/desativar o ranking** da turma e visualiza o Analytics das turmas que leciona.
- **Coordenador:** Acessa a Web SaaS com **Acesso Total dentro da sua escola**. O coordenador está vinculado a uma única escola (via `escola_id` no perfil). Possui visibilidade plena de todas as turmas **da sua escola**, professores, histórico global de alunos e dados analíticos. Pode cadastrar professores, vinculá-los/desvinculá-los de turmas da escola, adicionar alunos em qualquer turma da escola, alterar notas livremente, transferir alunos entre turmas (preservando o histórico), **cadastrar responsáveis e vincular a alunos** e gerenciar rankings. **Não tem acesso a dados de outras escolas.**
- **Responsável (Pai/Mãe):** Acessa o **mesmo App Flutter** dos alunos, com interface diferenciada por role. Possui acesso **somente leitura** a um painel simplificado (boletim) que mostra as atividades realizadas pelo(s) filho(s) e suas notas. O responsável pertence a uma única escola (`escola_id` no perfil) e só pode ser vinculado a alunos da mesma escola. O cadastro do responsável e a vinculação aos alunos é feita **exclusivamente pelo Coordenador**. Um responsável pode estar vinculado a múltiplos alunos (ex: irmãos). **Não recebe push notifications** — o acesso é por consulta ativa.
- **Administrador (Admin):** Usa o painel do administrador do Django como perfil técnico de suporte e contingência. Não é dependência do fluxo principal de onboarding de escolas.

---

## 3. Funcionalidades Principais

### 3.1. Landing Page Pública
- **Proposta de Valor:** Apresentação clara do produto SkillFlow e seus diferenciais (IA, correção automática, analytics de turma).
- **Ecossistema Integrado (Seção "Como Funciona"):** Uma seção dedicada na landing page deve **explicar detalhadamente o funcionamento integrado** entre a versão web (para professores/coordenadores) e o aplicativo mobile (para alunos e pais). Deve apresentar o fluxo completo: Professor cria atividade na Web → Aluno resolve no App → IA corrige → Professor analisa → Pais acompanham pelo App. Deve incluir mockups visuais ou ilustrações do app e do dashboard lado a lado.
- **Diferencial Família:** Destacar na landing page que os pais/responsáveis também têm acesso ao app para acompanhar o desempenho escolar dos filhos em tempo real.
- **Call-to-Action (CTA):** Botão de contato/demonstração e opção de iniciar auto-cadastro da escola para Coordenador/Diretor. CTA repetido no final da página.
- **Download do App:** Seção com links placeholder para futuro download nas lojas (Google Play / App Store).
- **SEO Básico:** Tags de título, meta descriptions, heading hierarchy (`h1` único), HTML semântico.

### 3.2. Autenticação e Onboarding
- **Login Unificado (JWT):** Tanto o App Mobile quanto a Web SaaS utilizam a mesma API de autenticação via Bearer Token (JWT) com refresh token.
- **Login no App (Aluno):** O aluno faz login no Flutter usando email e senha provisória gerada pelo Professor/Coordenador. No primeiro acesso, o sistema **bloqueia qualquer outra ação** e força a troca de senha antes de prosseguir.
- **Login no App (Responsável):** O responsável faz login no mesmo app Flutter e é direcionado para uma interface somente leitura. Usuários `PROFESSOR` e `COORDENADOR` são rejeitados no app com orientação para usar a Web SaaS.
- **Login na Web (Professor/Coordenador):** Login convencional com email e senha. Se um usuário com role `ALUNO` tentar acessar a plataforma Web, o sistema rejeita com mensagem "Acesso restrito a docentes".
- **Auto-cadastro de Escola + Coordenador/Diretor:** O fluxo público permite que o Coordenador/Diretor informe os dados da escola e seus dados de acesso no mesmo formulário, criando automaticamente `Escola + Usuário (role=COORDENADOR)` já vinculados.
- **Criação de Contas Docentes:** Após o auto-cadastro inicial, o Coordenador pode convidar/cadastrar Professores pelo painel SaaS. O Admin fica restrito a suporte técnico/contingência.
- **Recuperação de Senha:** Fluxo completo de "Esqueci minha senha" disponível tanto no App quanto na Web. Etapas: (1) usuário informa email → sistema cria um token de reset com expiração e uso único (simulado via log no console em dev), (2) usuário informa token + nova senha → sistema valida token e atualiza a senha.
- **Logout:** Disponível tanto no App quanto na Web. Ao fazer logout, o sistema invalida o refresh token usando a blacklist do mecanismo JWT escolhido para impedir reutilização.

### 3.3. Gestão de Matrículas e Transferências (SaaS Web)
- **Onboarding de Alunos:** O Professor pode cadastrar alunos **nas turmas que ele leciona**. O Coordenador pode cadastrar alunos em **qualquer turma**. É gerada uma credencial (email + senha provisória).
- **Gestão de Professores por Turma:** O Coordenador pode listar professores da escola, vincular professores a turmas e remover vínculos existentes. O vínculo `ProfessorTurma` define quais turmas o professor pode visualizar e operar.
- **Cadastro em Massa por IA (PDF):** O Professor ou Coordenador pode fazer upload de um PDF contendo uma lista de alunos (com nome e email de cada um). O sistema processa o PDF (suportando tanto PDFs com texto selecionável quanto documentos escaneados via OCR), utiliza IA para extrair e estruturar os dados (nome + email), e cria automaticamente todos os alunos na turma selecionada com senhas provisórias. Ao final, exibe um relatório de sucesso/falha (ex: emails duplicados, formatos inválidos). O processamento é **assíncrono** (fila).
- **Transferência de Turma (Coordenador):** O Coordenador possui o poder de transferir um aluno de Turma (ex: Mudar do *1º Ano A* para o *1º Ano B*). O histórico de submissões e notas antigas fica preservado no banco. Na visão do professor da nova turma, ele verá apenas os exercícios da turma atual. O Coordenador, por ter acesso total, visualiza o **histórico completo** do aluno (todas as turmas).
- **Gestão de Responsáveis (Coordenador):** O Coordenador pode cadastrar pais/responsáveis no sistema (gerando credenciais com email + senha provisória) e vincular cada responsável a um ou mais alunos. Esse vínculo permite que o responsável visualize o boletim dos filhos no app. Apenas o Coordenador possui permissão para criar e gerenciar esses vínculos familiares.

### 3.4. Dashboard de Analytics e Mapeamento de Dificuldades (SaaS)
O sistema compila de forma agregada os erros corrigidos pela Inteligência Artificial e dispõe esses dados no painel docente. 
- **Curadoria de Dados:** Mostra tendências ("70% da Turma 3º B está errando em Interpretação de Texto"), filtráveis por **disciplina/matéria**.
- **Visão Individual e Coletiva:** Identificação de alunos com déficit em habilidades específicas. A IA atua como curadora estatística.

### 3.5. Criação Modular de Tarefas e "Drip Content"
- **Estrutura Hierárquica:** O professor cria uma **Atividade** (ex: "Prova de Matemática Capítulo 3") que agrupa N **Exercícios** dentro dela. A atividade contém os metadados gerais (disciplina, data de liberação, data limite), e dentro dela ficam as questões individuais (múltipla escolha e/ou dissertativas).
- **Diferenciação de Tipo de Atividade:** O sistema distingue explicitamente dois tipos de atividade:
  - `EXERCICIO` — Prática, lição de casa, lista de exercícios. Peso padrão = 1.
  - `PROVA` — Avaliação oficial/formal. O professor **obrigatoriamente define o peso** da prova (ex: peso 3 significa que a prova vale 3x mais que um exercício no cálculo da média). A nota da prova vai de 0 a 100.
- **Campos Obrigatórios da Atividade:** Título, disciplina/matéria, tipo (EXERCICIO ou PROVA). Os campos `data de liberação` (dia e hora de abertura) e `data limite de entrega` (dia e hora de fechamento) são **obrigatórios no momento da publicação/agendamento**, mas podem ficar vazios enquanto a atividade estiver em status DRAFT. **Ambos os campos aceitam data e hora (datetime), permitindo ao professor configurar o dia e horário exatos de abertura e fechamento.** Isso se aplica igualmente a EXERCICIO e PROVA. Se o tipo for `PROVA`, o campo `peso` é obrigatório (>= 1). Após a data limite, o aluno não consegue mais submeter respostas.
- **Drip Content (Publicação Agendada):** O professor sobe atividades/listas e define datas e horários de liberação. O conteúdo surge no App apenas no futuro programado. Tanto exercícios quanto provas podem ser agendados. **Mecanismo:** O endpoint de listagem do aluno filtra por `data_liberacao <= NOW` e `status_publicacao IN (AGENDADO, PUBLICADO)`, garantindo que atividades agendadas só apareçam quando o horário chega. Uma **task periódica (Celery Beat)** roda a cada minuto e transiciona atividades `AGENDADO → PUBLICADO` cuja `data_liberacao <= NOW`.
- **Edição e Exclusão de Atividades:** O professor pode editar atividades em status `DRAFT` (título, exercícios, tipo, peso). Atividades já publicadas podem ter apenas a `data_limite` estendida. Atividades em `DRAFT` podem ser excluídas (em cascata com exercícios). Atividades `PUBLICADAS` com submissões **não podem ser excluídas**.
- **Criação Assistida por IA com Fluxo de Moderação (Draft Mode):** 
  - O professor anexa um material de apoio (PDF de apostila/documentação) e pede que a IA gere questões a partir dele (RAG).
  - O material fica armazenado no sistema para consultas futuras (banco de materiais reutilizáveis).
  - O material gerado entra em status de `Rascunho / Pendente Revisão`. O professor valida, edita e então aprova a publicação.

### 3.6. Submissões e Lógica de Avaliação (App / API)
- **Métodos de Resposta (Híbrido Inteligente):**
  - **Múltipla Escolha:** Respondidas diretamente no App via marcação de alternativas (UX fluida). Correção **instantânea e local** no backend — simples comparação com gabarito, sem IA.
  - **Dissertativas / Cálculo:** O app oferece captura por câmera com recorte/scan e também seleção de arquivo PDF. Em ambos os casos, o app gera ou envia um **PDF final** para o backend, que faz leitura via OCR por IA. Correção **assíncrona** (fila de processamento). **Limite de tamanho de upload: 10 MB por PDF.**
- **Validação de Prazo:**
  - **Submissão online:** A API valida `NOW > data_limite` → rejeita com HTTP 400.
  - **Submissão offline (sincronização):** O App salva `timestamp_local`, `server_time_snapshot`, `client_server_offset_ms` e `atividade_updated_at_snapshot` no momento do cache/sincronização. Ao enviar, a API calcula um horário estimado de servidor (`timestamp_local + client_server_offset_ms`) e valida contra `data_limite`, aceitando apenas uma tolerância pequena de clock drift (ex: 5 minutos). Caso o offset esteja ausente, incoerente ou acima do limite permitido, a submissão entra em conflito para revisão em vez de ser aceita automaticamente.
- **Cálculo da Nota Final da Atividade:** A nota da atividade (0 a 100) é calculada **automaticamente pelo sistema** de forma proporcional:
  - Questões de múltipla escolha recebem nota binária individual (certo = 100, errado = 0).
  - Questões dissertativas recebem nota parcial definida pela IA (0 a 100 por questão).
  - A nota final da atividade é a **média simples de todas as questões**: `soma_notas_individuais / total_questoes`. Enquanto houver questões sem submissão/correção e o prazo ainda não venceu, a atividade exibe nota parcial. Após o prazo, questões não respondidas ou não sincronizadas sem conflito válido contam como `0`, evitando inflar a média por dividir apenas pelas questões respondidas.
- **Cálculo da Média Geral do Aluno (Ponderada por Peso):** A média geral do aluno na turma é calculada levando em conta o **peso** de cada atividade. A média final é sempre de 0 a 100:
  ```
  media_geral = soma(nota_atividade * peso_atividade) / soma(peso_atividade)
  ```
  Onde `peso = 1` para Exercícios e `peso = valor definido pelo professor` para Provas. Ex: Se um aluno tem nota 80 em um exercício (peso 1) e nota 60 em uma prova (peso 3), a média geral = (80×1 + 60×3) / (1+3) = 260/4 = 65.
- **Status da Submissão:** Cada submissão possui um ciclo de vida claro: `PENDENTE` → `EM_PROCESSAMENTO` → `CORRIGIDA` → `REVISADA_PROFESSOR`. O status `CORRIGIDA` indica que a correção automática foi concluída (seja por comparação de gabarito em MC ou pela IA em dissertativas). O status `REVISADA_PROFESSOR` é atribuído **quando o professor faz override de nota** em uma submissão — a transição é automática ao salvar o override. Submissões offline com metadados incoerentes ou atividade alterada/removida entram em `CONFLITO_SYNC` e ficam aguardando decisão docente. O App exibe "Aguardando correção...", "Nota disponível" ou "Envio em análise" conforme o status.
- **Push Notifications:** Quando a IA termina a correção do último exercício dissertativo de uma atividade, o App dispara um Aviso Push: *"Sua correção da atividade [Atividade X] acabou de chegar!"* (Apenas para alunos — responsáveis não recebem push).
- **Override de Notas e Feedback:** Professores e Coordenadores possuem poder de override **a qualquer momento** após a submissão (não há janela de tempo): podem alterar a nota de exercícios individuais (no nível de `Submissao`) e também **sobrescrever ou complementar o feedback** gerado pela IA (campo `feedback_professor`). O feedback exibido ao aluno segue a regra: `feedback_final = feedback_professor ?? feedback_ia`. Para override da nota consolidada da atividade por aluno, o sistema utiliza uma tabela `NotaAtividadeAluno` que armazena `aluno_id`, `atividade_id`, `nota_override` e `override_por_id`. A nota final exibida ao aluno segue a regra: `nota_final = nota_professor_override ?? nota_calculada_sistema`. Ao fazer override, o status da submissão é atualizado para `REVISADA_PROFESSOR` e o campo `override_por_id` registra quem fez a alteração.

### 3.7. Funcionalidade Offline-First (App Flutter)
- **Cache Local de Exercícios:** Ao abrir o App com internet, as atividades e exercícios disponíveis da turma do aluno são baixados e cacheados localmente (SQLite). O aluno pode visualizar e ler os enunciados **sem conexão**. Os dados locais possuem `updated_at`, `server_time_snapshot` e `client_server_offset_ms` para sincronização incremental e validação de prazo.
- **Fila de Submissões Offline com Timestamp Local Protegido:** Se o aluno responder um exercício sem internet, a resposta fica salva localmente com o **timestamp de quando foi respondida no dispositivo** e metadados de sincronização. Quando reconectar, o sistema envia automaticamente as submissões pendentes ao backend. A API valida o prazo usando o timestamp ajustado pelo offset do servidor e registra conflito quando detectar relógio manipulado, atividade alterada/removida ou cache desatualizado.
- **Indicador Visual:** O App exibe ícone de "Offline" e badge de "X respostas pendentes de envio" para que o aluno tenha ciência do estado.
- **Conflitos de Sincronização:** Se uma atividade foi alterada/removida no servidor enquanto o aluno estava offline, ou se o app enviar metadados de prazo incoerentes, a submissão não é corrigida automaticamente. O app mostra "Envio em análise" e a Web SaaS permite que professor/coordenador aceite, rejeite ou solicite reenvio.

### 3.8. Chat/Tutoria com Limites Educacionais
- **Chat Com o Verificador:** O chat **só pode ser utilizado após a correção** da submissão (status `CORRIGIDA` ou `REVISADA_PROFESSOR`). O estudante pode abrir um chat com a IA para tirar dúvidas sobre a correção (tanto para exercícios dissertativos corrigidos pela IA, quanto para múltipla escolha onde quer entender o motivo do erro). Se a submissão ainda estiver `PENDENTE` ou `EM_PROCESSAMENTO`, o sistema bloqueia o acesso ao chat.
- **Limitação Anti-Abuso:** O aluno possui limite de **3 mensagens por exercício corrigido** (ou seja, 3 mensagens enviadas pelo aluno, cada uma gerando 1 resposta da IA). O `contador_mensagens_aluno` é incrementado a cada mensagem enviada. Ao atingir 3, o input é desabilitado com HTTP 403. Isso inibe fraudes, uso excessivo de tokens e força a dedução do aluno.

### 3.9. Painel Individual do Aluno (App)
O aluno possui um **dashboard de progresso** como tela principal do app, com:
- **Nota Média Geral:** Média ponderada de todas as atividades da turma, levando em conta os pesos (exercícios peso 1, provas com peso definido pelo professor).
- **Progresso por Disciplina:** Gráfico de barras ou radar mostrando a média por disciplina.
- **Histórico de Notas:** Gráfico de linha mostrando evolução das notas ao longo do tempo.
- **Resumo de Atividades:** Contagem de atividades pendentes, em andamento e concluídas.
- A partir deste painel, o aluno acessa a lista de atividades.

### 3.10. Ranking da Turma (App)
O sistema possui **dois tipos de ranking**, ambos por turma:
- **Ranking de Pontuação:** Baseado na **soma** das notas de todas as atividades (exercícios + provas) do aluno. Quem mais acumula pontos ao longo do período fica no topo.
- **Ranking de Provas:** Baseado exclusivamente nas notas de atividades do tipo `PROVA`. Calcula a média ponderada (por peso) das provas.

**Controle de Visibilidade:** O professor ou coordenador pode **ativar ou desativar** cada tipo de ranking a qualquer momento pelo painel SaaS. Quando desativado, a tela de ranking no app do aluno exibe mensagem indicativa ("O ranking está desativado para esta turma"). O aluno vê o ranking completo da turma (posição, nome e pontuação de todos os colegas).

### 3.11. Painel de Pais/Responsáveis (App)
Os pais/responsáveis acessam o **mesmo app Flutter** dos alunos, com interface própria baseada na role `RESPONSAVEL`:
- **Seletor de Filhos:** Se o responsável possui vínculo com múltiplos alunos (ex: irmãos), a primeira tela exibe a lista de filhos para seleção.
- **Boletim de Atividades:** Painel simplificado e read-only mostrando:
  - Lista de todas as atividades realizadas pelo filho, separadas por tipo (Exercício / Prova)
  - Nota obtida em cada atividade
  - Disciplina e data de realização
  - Média geral ponderada do filho
- **Sem acesso a:** chat tutor, ranking, submissão de respostas, push notifications.
- **Cadastro e vínculo:** Apenas o Coordenador pode cadastrar um responsável e vinculá-lo a um ou mais alunos pelo painel SaaS.

---

## 4. Requisitos Técnicos e Arquitetura Resumida
- **Móvel:** Flutter para Alunos e Responsáveis (Notificações Push com FCM/Firebase apenas para alunos, SQLite para offline-first do aluno).
- **Frontend SaaS + Landing Page:** Next.js (rotas públicas para Landing, rotas protegidas para SaaS).
- **Core backend:** Django / Django Ninja.
- **Armazenamento:** PostgreSQL + armazenamento de arquivos (PDFs de submissões e materiais de apoio). Limites: PDF de submissão ≤ 10 MB, material de apoio ≤ 50 MB, PDF de cadastro em massa ≤ 10 MB.
- **Segurança de Uploads:** Validar extensão, MIME real e assinatura do arquivo PDF; aplicar limite de páginas/tamanho, timeout de OCR, antivírus/sandbox em produção e tratamento seguro de PDFs malformados.
- **Assíncrono:** Filas Background (Celery/Redis) + Celery Beat (task periódica para Drip Content).
- **Motores IA:** LLMs (apenas para questões dissertativas, chat e extração de dados de cadastro em massa) conectando leitura OCR, geração RAG e memória contextual. Prompts devem isolar conteúdo enviado por usuários como dados não confiáveis, instruindo o modelo a ignorar comandos presentes em PDFs/materiais.
- **Paginação:** Todos os endpoints que retornam listas utilizam paginação por `page`/`page_size`, com `page_size` padrão = 20 e máximo = 100.
- **Multi-tenant por Escola:** Cada instância lógica é isolada por escola. Coordenadores só acessam dados da sua escola.
