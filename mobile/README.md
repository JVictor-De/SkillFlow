# SkillFlow · App Mobile (Flutter)

App Flutter para **Alunos** e **Responsáveis** do SkillFlow. Diferenciado
por papel a partir do login, suporta operação **offline-first** (SQLite
local + fila de submissões pendentes) e push notifications via Firebase
para alunos.

> Professores e Coordenadores usam a plataforma web em `../frontend/`.

## Pré-requisitos

- Flutter 3.24+
- Dart 3.5+
- Android Studio / Xcode com SDKs configurados
- Emulador Android (recomendado: API 33) ou device físico

> Importante: o app **não suporta** docentes. Tentativas de login com
> `PROFESSOR` ou `COORDENADOR` recebem mensagem clara e bloqueio.

## Variáveis de ambiente

A configuração é feita via `--dart-define`:

| Variável         | Default              | Descrição                              |
|------------------|----------------------|----------------------------------------|
| `API_BASE_URL`   | `http://10.0.2.2:8000` | URL da API consumida pelo app         |
| `USE_MOCKS`      | `true`               | Usa mocks locais para navegar sem API |

Em emulador Android, `10.0.2.2` aponta para o `localhost` do host. Em
device físico, use o IP da máquina onde a API roda.

## Como rodar localmente

```bash
cd mobile
flutter pub get
flutter run
# ou apontando para a API real
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000 --dart-define=USE_MOCKS=false
```

### Credenciais para o modo mock

| Papel       | E-mail                       | Senha (qualquer 4+ chars) | Fluxo                                 |
|-------------|------------------------------|---------------------------|---------------------------------------|
| Aluno       | `aluno@skillflow.dev`        | `qualquer`                | Painel do aluno                       |
| Responsável | `pais@skillflow.dev`         | `qualquer`                | Seletor de filhos / boletim           |
| Aluno novo  | `novato@skillflow.dev`       | `qualquer`                | Força troca de senha antes do painel  |

Tente também logar com `professor@skillflow.dev` para ver a rejeição.

## Apontando para a API hospedada no Coolify

Em produção (Coolify), o app deve consumir a API pública via HTTPS.
Builde com:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.seu-dominio.com \
  --dart-define=USE_MOCKS=false
```

Configure também o `firebase_options.dart` (gerado por `flutterfire
configure`) caso queira usar push notifications reais.

## Funcionalidades-chave

### Aluno

- **Painel**: média geral ponderada, progresso por disciplina, histórico,
  atividades pendentes/concluídas, pull-to-refresh.
- **Atividades**: lista filtrada por tipo (`Exercício` / `Prova`).
- **Múltipla escolha**: tap em alternativa A–E, envio com correção
  imediata e badge de nota.
- **Dissertativa**: scanner via câmera ou seleção de PDF (limite 10 MB),
  estado "Correção em processamento".
- **Resultado**: nota, feedback e atalho para Chat com tutor IA.
- **Chat IA**: contador `0/3` … `3/3`, bloqueio na quarta tentativa e
  bloqueio quando submissão ainda não foi corrigida.
- **Ranking**: tabs Pontuação e Provas com destaque do aluno logado e
  mensagem clara quando o ranking está desativado.

### Responsável

- **Seletor de filhos**: lista vinculada com nome, turma e escola.
  Quando há somente um filho, abre o boletim direto.
- **Boletim**: separação clara em `Provas` e `Exercícios`, média geral
  ponderada, filtro por disciplina, sem chat / ranking / submissão.

## Offline-first

Implementado em `lib/services/sync_service.dart` + `local_database.dart`:

1. `calculateOffset` chama `/api/app/sync/server-time/` e calcula
   `client_server_offset_ms`.
2. `downloadAtividades` baixa atividades + exercícios e salva no SQLite
   junto com `updated_at`, `server_time_snapshot` e
   `client_server_offset_ms`.
3. `enqueueSubmissaoMC` / `enqueueSubmissaoPdf` carimbam cada envio
   com `timestamp_local` e os snapshots de tempo.
4. `sendPendentes` reenvia tudo na primeira conexão. Quando a API
   retorna 409 (conflito), a submissão local é marcada como
   `CONFLITO_SYNC` e o aluno vê "Envio em análise".

## Push Notifications

`PushService` (em `lib/services/push_service.dart`) inicializa o Firebase
Cloud Messaging apenas para alunos e registra o token em
`/api/app/device-token/`. Quando uma notificação chega, a navegação leva
para a tela de Resultado correspondente.

## Testes

```bash
flutter test
```

A suíte cobre:

- Login válido para aluno e responsável
- Login docente é rejeitado pelo app (must use web)
- Painel renderiza média geral e resumo
- Atividades exibem filtro por tipo
- MC permite selecionar e enviar
- Dissertativa mostra opções de scanner e anexar PDF
- Chat bloqueia após 3 mensagens
- Ranking de provas (mock desativado) mostra mensagem
- Seletor de filhos renderiza
- Boletim separa provas e exercícios
- SyncService calcula offset e envia submissões pendentes

## Estrutura

```
mobile/
├── lib/
│   ├── config/         # tema e variáveis de ambiente
│   ├── models/         # AuthUser, Atividade, Submissao, Boletim, Ranking
│   ├── services/       # API client, mocks, auth, aluno, responsavel,
│   │                   # local database, sync, push
│   ├── providers/      # AuthProvider (provider package)
│   ├── screens/
│   │   ├── aluno/      # painel, atividades, MC, dissertativa, resultado,
│   │   │               # chat, ranking, perfil
│   │   ├── responsavel/ # seletor de filhos, boletim
│   │   ├── login_screen.dart
│   │   ├── trocar_senha_screen.dart
│   │   └── home_router.dart
│   ├── widgets/        # componentes compartilhados
│   └── main.dart
├── test/               # flutter_test
└── pubspec.yaml
```

## Tratamento de erros

`ApiException.friendly` traduz HTTP 4xx/5xx em mensagens amigáveis em
português. Telas críticas (painel, atividades, resultado, ranking,
boletim) sempre apresentam estado de loading, erro com botão "Tentar
novamente" e empty state.
