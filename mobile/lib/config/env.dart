/// Configuração de variáveis de ambiente do app SkillFlow.
///
/// Em produção, defina `--dart-define=API_BASE_URL=https://api.seu-dominio.com`
/// ao buildar. Em desenvolvimento o default cobre o emulador Android (10.0.2.2)
/// apontando para `localhost:8000` do host.
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const bool useMocks = bool.fromEnvironment(
    'USE_MOCKS',
    defaultValue: true,
  );

  /// Tolerância máxima de clock drift admitida pelo backend (em milissegundos).
  static const int clockDriftToleranceMs = 5 * 60 * 1000;

  /// Limite máximo do PDF de submissão dissertativa (10MB).
  static const int submissaoPdfMaxBytes = 10 * 1024 * 1024;
}
