export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly raw?: unknown,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.detail || "Dados inválidos. Revise as informações.";
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 403:
        return error.detail || "Você não tem permissão para esta ação.";
      case 404:
        return "Recurso não encontrado.";
      case 409:
        return (
          error.detail ||
          "Conflito de estado. O recurso já existe ou não pode ser alterado."
        );
      case 500:
        return "Erro inesperado. Tente novamente em alguns instantes.";
      default:
        return error.detail || "Não foi possível concluir a operação.";
    }
  }
  if (error instanceof Error) return error.message;
  return "Erro inesperado. Tente novamente.";
}
