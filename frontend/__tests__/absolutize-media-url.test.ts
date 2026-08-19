/**
 * Bug 4 — "PDF abrindo 404".
 *
 * O helper `absolutizeMediaUrl` é a peça que garante que qualquer link
 * para `/media/...` (PDF de submissão, apostila do RAG) abra contra o
 * domínio da API e não contra o do Next.js. Os casos cobertos abaixo
 * mapeiam exatamente os payloads que o backend pode entregar:
 *
 *  - `null` / `undefined` / vazio → componente esconde o link.
 *  - URL absoluta (a partir do fix do `request.build_absolute_uri`) →
 *    mantém como veio.
 *  - URL relativa (clientes antigos / mocks) → recebe `${API_URL}` na
 *    frente.
 *  - Esquema `//` (CDN externo) → ganha `https:`.
 *
 * `jest.setup.ts` força `NEXT_PUBLIC_API_URL=http://localhost:8000`,
 * então é esse host que esperamos nas asserções.
 */

import { absolutizeMediaUrl } from "@/lib/api";

describe("absolutizeMediaUrl", () => {
  const API = "http://localhost:8000";

  it("retorna null para entradas vazias ou nulas", () => {
    expect(absolutizeMediaUrl(null)).toBeNull();
    expect(absolutizeMediaUrl(undefined)).toBeNull();
    expect(absolutizeMediaUrl("")).toBeNull();
    expect(absolutizeMediaUrl("   ")).toBeNull();
    expect(absolutizeMediaUrl("#")).toBeNull();
  });

  it("preserva URLs absolutas https:// (já vêm do backend ou de S3/CDN)", () => {
    const url = "https://api.skillflow.peladeiro.cloud/media/submissoes/x.pdf";
    expect(absolutizeMediaUrl(url)).toBe(url);
  });

  it("preserva URLs absolutas http://", () => {
    expect(absolutizeMediaUrl("http://localhost:8000/media/x.pdf")).toBe(
      "http://localhost:8000/media/x.pdf",
    );
  });

  it("prefixa esquema https para URLs com //host (CDN externo)", () => {
    expect(absolutizeMediaUrl("//cdn.example.com/x.pdf")).toBe(
      "https://cdn.example.com/x.pdf",
    );
  });

  it("prefixa API_URL quando recebe caminho com leading slash", () => {
    expect(absolutizeMediaUrl("/media/submissoes/foo.pdf")).toBe(
      `${API}/media/submissoes/foo.pdf`,
    );
  });

  it("prefixa API_URL/ quando recebe caminho relativo sem leading slash", () => {
    // Caso histórico do bug: backend devolvia "media/..." (MEDIA_URL sem
    // a barra inicial). Mesmo após o fix de settings o helper precisa
    // continuar resolvendo esse formato para clientes que ainda recebam
    // payloads legados.
    expect(absolutizeMediaUrl("media/submissoes/foo.pdf")).toBe(
      `${API}/media/submissoes/foo.pdf`,
    );
  });

  it("mantém data: e blob: URLs como estão (preview de upload)", () => {
    expect(absolutizeMediaUrl("data:application/pdf;base64,JVBERi0=")).toBe(
      "data:application/pdf;base64,JVBERi0=",
    );
    expect(absolutizeMediaUrl("blob:http://localhost/abc")).toBe(
      "blob:http://localhost/abc",
    );
  });

  it("ignora espaços em branco em volta da URL", () => {
    expect(absolutizeMediaUrl("  /media/x.pdf  ")).toBe(`${API}/media/x.pdf`);
  });
});
