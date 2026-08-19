import { ApiError } from "./errors";
import { tokenStorage } from "./storage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export type RequestOptions = RequestInit & {
  /** Disable automatic Authorization header injection. */
  anonymous?: boolean;
  /** Send data as `multipart/form-data`. */
  formData?: boolean;
  /** Search params appended to the URL. */
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_URL}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseError(response: Response): Promise<never> {
  let detail = response.statusText;
  let raw: unknown;
  try {
    raw = await response.json();
    if (raw && typeof raw === "object") {
      const data = raw as Record<string, unknown>;
      detail =
        (typeof data.detail === "string" && data.detail) ||
        (typeof data.message === "string" && data.message) ||
        JSON.stringify(data);
    }
  } catch {
    /* response não era JSON */
  }
  throw new ApiError(response.status, detail, raw);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    anonymous,
    formData,
    query,
    headers: incomingHeaders,
    body,
    ...rest
  } = options;

  const headers = new Headers(incomingHeaders);
  if (!formData && body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (!anonymous) {
    const token = tokenStorage.getAccess();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers,
    body,
    cache: rest.cache ?? "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 && !anonymous) {
      tokenStorage.clear();
    }
    await parseError(response);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body:
        data instanceof FormData
          ? data
          : data !== undefined
            ? JSON.stringify(data)
            : undefined,
      formData: data instanceof FormData,
    }),
  put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      body:
        data instanceof FormData
          ? data
          : data !== undefined
            ? JSON.stringify(data)
            : undefined,
      formData: data instanceof FormData,
    }),
  delete: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export const apiBaseUrl = API_URL;

/**
 * Build an absolute URL for a backend-served media path.
 *
 * Django serves uploaded PDFs under `/media/...`. Quando API e
 * frontend vivem em origens diferentes (Next em `app.skillflow...` e
 * Django em `api.skillflow...`), abrir `s.pdf_url` direto faria o
 * navegador procurar o PDF no domínio do frontend e retornar 404.
 * Por isso passamos o valor por este helper antes de renderizar em
 * `<a href>` ou `window.open`.
 *
 * Aceita:
 * - `null` / `undefined` / string vazia → retorna `null` (UI condicional)
 * - URL absoluta `https://.../foo.pdf` → mantém como veio (S3/CDN/já
 *   absolutizado pelo backend)
 * - URL com esquema implícito `//host/path` → prefixa `https:`
 * - Caminho começando com `/media/...` → prefixa `${API_URL}`
 * - Caminho relativo `media/...` (legado) → prefixa `${API_URL}/`
 *
 * Mantemos o helper defensivo no frontend mesmo após o backend passar a
 * devolver URLs absolutas (`request.build_absolute_uri`): assim
 * clientes desatualizados, mocks e payloads históricos continuam
 * funcionando sem cair em 404.
 */
export function absolutizeMediaUrl(
  url: string | null | undefined,
): string | null {
  if (url == null) return null;
  const trimmed = String(url).trim();
  if (!trimmed || trimmed === "#") return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  // `data:` / `blob:` URLs (preview de upload local) já são absolutos.
  if (/^(data|blob):/i.test(trimmed)) return trimmed;
  const base = API_URL.replace(/\/$/, "");
  return trimmed.startsWith("/")
    ? `${base}${trimmed}`
    : `${base}/${trimmed}`;
}
