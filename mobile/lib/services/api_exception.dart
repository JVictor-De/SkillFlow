class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic raw;

  ApiException(this.statusCode, this.message, [this.raw]);

  @override
  String toString() => 'ApiException($statusCode): $message';

  static String friendly(Object error) {
    if (error is ApiException) {
      switch (error.statusCode) {
        case 400:
          return error.message.isNotEmpty
              ? error.message
              : 'Dados inválidos. Revise as informações.';
        case 401:
          return 'Sessão expirada. Faça login novamente.';
        case 403:
          return error.message.isNotEmpty
              ? error.message
              : 'Você não tem permissão para esta ação.';
        case 404:
          return 'Recurso não encontrado.';
        case 409:
          return error.message.isNotEmpty
              ? error.message
              : 'Conflito de estado. Tente novamente.';
        case 500:
          return 'Erro inesperado. Tente novamente em instantes.';
        default:
          return error.message;
      }
    }
    return error.toString();
  }
}
