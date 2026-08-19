# 🎨 Diretrizes de Design — SkillFlow (2026)

## 1. Visão Geral e Identidade Visual

O design do **SkillFlow** foi pensado para refletir o estado da arte em UI/UX de 2026, focando em minimalismo, acessibilidade e na **Jornada do Usuário** como pilar central. A navegação deve ser intuitiva, sem atrito, guiando atores diferentes (alunos, responsáveis, professores e coordenadores) para seus objetivos da forma mais direta possível.

- **Estética 2026:** Clean, com uso extensivo de *glassmorphism* refinado, sombras suaves e *whitespace* generoso.
- **Paleta e Regra 60-30-10:** Adoção da paleta Profissional & Autoritária para transmitir segurança e prestígio. 60% Fundo Neutro (`#F8FAFC`), 30% Azul Primário (`#1E3A8A` para estruturas) e 10% Amarelo Destaque (`#F59E0B` para interações).
- **Gradientes:** Uso de **leves degradês** nas cores da marca (Azul e Amarelo) em botões de ação e fundos de destaque, transmitindo modernidade e tecnologia sem perder a sobriedade institucional.
- **Tipografia:** Uma fonte sem serifa geométrica e moderna (ex: *Inter*, *Plus Jakarta Sans* ou *Geist*), com forte contraste entre títulos e corpo de texto (`#1E293B`). Escala tipográfica baseada em proporções harmônicas (ex: H1 32sp, Body 16sp).
- **Design System** Uso de um sistema de grid consistente (base 8pt) e uma família de ícones única de peso consistente para toda a aplicação.

---

## 2. Acessibilidade (A11y) e Estados da Interface

Para garantir um design democrático e coerente, a aplicação segue as seguintes premissas obrigatórias:
- **Acessibilidade Ouro:** Cumprimento de níveis AAA de contraste do WCAG. Em botões ou componentes contendo Amarelo de Destaque (`#F59E0B`), o texto **sempre** será Azul Escuro (`#1E293B`) ou Preto para garantir total legibilidade.
- **Áreas de Toque e Leitores:** Áreas de toque (*touch targets*) com mínimo de 48x48dp no mobile. Suporte nativo para leitores de tela e navegação por teclado em ambas as plataformas.
- **Empty States (Estados Vazios):** Sempre que uma tela não tiver conteúdo (ex: zero tarefas, nenhuma notificação), apresentar ilustrações leves e um texto motivacional indicando o que o usuário pode fazer. 
- **Error States:** Erros de rede e offline devem ser tratados forma "graceful", sem travar a interface. Avisos claros, com botões de "Tentar Novamente". Falhas num upload de PDF não devem perder os dados da tela local.
- **Loading States:** Uso de *skeleton screens* dinâmicas no lugar de simples "spinners", melhorando a percepção de tempo, especialmente na IA gerando atividades.

---

## 3. 🌐 Landing Page (Persuasão e Conversão)

A Landing Page é a vitrine do SkillFlow. O objetivo é puramente focado em conversão e convencimento de diretores/coordenadores de escolas.

### Jornada na Landing Page:
1. **Hero Section (Impacto Imediato):** 
   - **Título Forte:** "A Inteligência Artificial transformando a educação da sua escola."
   - **Visual:** Um mock realista ou animação suave da plataforma (Web e Mobile) flutuando sobre um fundo com gradiente sutil.
   - **Call-to-Action (CTA) Primário:** "Agendar uma Demonstração" ou "Falar com Consultor". Botão texturizado Amarelo de Destaque (`#F59E0B`) com letras escuras (`#1E293B`), projetando uma leve sombra amarelada para fisgar a atenção no topo.
2. **Features Resumidas (Proposta de Valor):**
   - Cards interativos com ícones minimalistas, usando efeitos de *hover* suaves.
   - **Tópicos:** Correção automática de PDF via IA, Criação Mágica de Exercícios (RAG), App Offline-First para alunos, boletim para responsáveis e Analytics de Turma.
3. **Social Proof (Prova Social):**
   - Depoimentos de coordenadores ("Reduzimos o tempo de correção em 80%").
4. **Bottom CTA:** 
   - Um fechamento limpo com o botão de CTA repetido para evitar que o usuário precise rolar a página de volta.
   - Badges visuais das lojas de aplicativo (Google Play e App Store) centralizados com hover styles visíveis para incentivar o download.

---

## 4. 🧩 Plataforma Web SaaS (Professores e Coordenadores)

A versão web é uma ferramenta de trabalho. O design deve ser voltado para **produtividade** e **análise de dados**.

### Mapa de Telas:
- **Tela de Login / Cadastro / Onboarding:** Entrada limpa, recuperação de senha, e fluxo inicial (criação da primeira turma, importação de alunos).
- **Dashboard Principal:** Assim que entra, encontra um *overview* das turmas com gráficos em card. Uso de cores semânticas (verde para envio em dia, vermelho para risco de notas).
- **Gestão de Perfil/Configurações da Escola:** Painel de administração, assinatura, modo dark/light e termos de privacidade.
- **Gestão de Turmas/Alunos:** Tabelas com filtros rápidos, suporte a busca instantânea e modais limpos.
- **Criação de Atividades (Fluxo Mágico):**
  - Formulários *stepper* (passo a passo) limpos.
  - O momento em que a IA gera as questões deve ser uma experiência de "mágica" (animações de *skeleton loading* com brilhos/gradientes sutis mostrando o processamento).
- **Central de Correção e Override:** Visualização do PDF do aluno lado a lado com a nota/parecer da IA, permitindo ajustes e sobreposição de nota manuais de forma rápida (painel dividido / *split view*).
- **UI/UX Estrutural:** Menus laterais (Sidebar) retráteis, top menu limpo.
- **Adaptação de Cores (Professor/Coordenador):** Concentração total. O Azul Primário (`#1E3A8A`) deve predominar estritamente nas barras e na estrutura. O Amarelo de Destaque (`#F59E0B`) fica restrito a alertas operacionais graves (ex: "Aluno com risco de reprovação" ou "Tarefas pendentes") e ao CTA principal.

---

## 5. 📱 App Mobile Flutter (Alunos e Responsáveis)

O App Mobile atende **alunos e responsáveis** no mesmo aplicativo, com interface diferenciada por role. Para alunos, deve ser fluido, rápido e não intimidante; para responsáveis, deve ser objetivo, legível e orientado à consulta.

### Mapa de Telas (Jornada do Aluno):
- **Onboarding e Login:** Tela inicial direta. O fluxo de primeira troca de senha deve ser suave, uma "ativação de conta".
- **Painel de Progresso (Dashboard):**
   - **Média Geral:** Exibida em destaque com codificação de cores semânticas.
   - **Gráficos:** Uso de gráficos modernos (radar e barras) integrados ao fundo com gradientes.
- **Hub de Atividades:**
   - Lista "Para Fazer", "Entregue", "Corrigido" em formato de cards.
   - Indicador visual de conectividade (Offline mode) não obstrutivo.
- **Resolução de Alternativas:** Toque rápido, tela fluida com botão de enviar fixo na parte inferior.
- **Scanner Integrado (Tarefas Dissertativas):** Experiência nativa de câmera e recorte, gerando um PDF final, ou permitindo o envio de PDF pronto do dispositivo.
- **Feedback das Atividades e Chat:** O recebimento de notas traz gradientes animados na nota (leve gamificação). Chat com o tutor IA como interface de mensageria natural em bolhas de texto.
- **Ranking / Leaderboard:** Lista limpa com destaque (card elevado/borda vibrante) para a posição do aluno logado.
- **Perfil do Aluno:** Edição de dados e configurações de tema.
- **Adaptação de Cores (Aluno):** Interface energizante. Permite um uso um pouco mais desprendido do Amarelo de Destaque (`#F59E0B`) em medalhas, preenchimento de barras de progresso, botões de ação final. O Azul serve de âncora e botões de navegação secundários.

### Mapa de Telas (Jornada do Responsável):
- **Seletor de Filhos (Múltiplas Matrículas):** Garantia de privacidade e contexto ao trocar a visualização de filhos (nome, turma, escola explícitos).
- **Boletim Simplificado:** Foco visual limpo apenas com a média escolar, histórico de provas e notas recentes. Evitando termos de software complexos.
- **Aba de Alertas e Notificações (Críticos):** Visões silenciosa e objetivas de desempenho sem exageros.
- **Consultas sem Ruído:** Não ver telas de resolução, chat com IA ou rankings.
- **Adaptação de Cores (Pais/Responsáveis):** Conforto e serenidade. Domínio total do Azul Primário (`#1E3A8A`) para passar clareza e paz de espírito. O Amarelo (`#F59E0B`) deve ser usado esporadicamente para destacar resultados positivos, mensagens não lidas ou datas de reuniões com professores.

---

## 6. Resumo das Decisões Visuais

| Componente | Estilo (2026) |
|---|---|
| **Paleta Base (Institucional)** | Fundo principal Neutro (`#F8FAFC`), Navbars/Sidebars em Azul Primário (`#1E3A8A`), e textos principais em Azul Acinzentado muito escuro (`#1E293B`). |
| **Botões (CTA)** | Cantos levemente arredondados, uso de Amarelo de Destaque (`#F59E0B`) para ações principais, com sombras difusas no mesmo tom para dar o ar de *glow* de 2026. Texto interno sempre escuro. |
| **Cards** | Bordas finas, fundo branco puro ou semi-transparente (glassmorphism leve sob fundo do sistema), foco em separar a informação sem pesar o ambiente. |
| **Gráficos (Analytics)** | Cores análogas em gradientes para barras e linhas, enfatizando tendências. |
| **Feedback Visual** | Microinterações ao enviar, clicar e receber notas (haptics no mobile). |