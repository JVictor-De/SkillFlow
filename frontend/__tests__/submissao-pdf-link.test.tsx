/**
 * Bug 4 — "PDF abrindo 404".
 *
 * Teste de componente que confirma o último elo da cadeia: quando o
 * mapper devolve uma URL absoluta para `pdf_url`, o detalhe da
 * submissão renderiza um link `<a target="_blank">` apontando exatamente
 * para esse URL — e não passa por `<Link>` do Next, que resolveria a rota
 * dentro do bundle do frontend e voltaria a cair em 404.
 */

import { render, screen, waitFor } from "@testing-library/react";

import { SubmissaoDetalheView } from "@/features/submissoes/submissao-detalhe";
import { mockSubmissaoDetalhe } from "@/lib/mocks/fixtures";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("SubmissaoDetalheView — link de PDF (Bug 4)", () => {
  const PDF_URL =
    "https://api.skillflow.peladeiro.cloud/media/submissoes/resp_X.pdf";

  beforeEach(() => {
    // Forçamos um valor não-null no mock só para esta suíte; o restante
    // dos testes da plataforma continua usando o fixture original (`null`),
    // que valida o caminho onde o card de PDF some.
    (mockSubmissaoDetalhe as { pdf_url: string | null }).pdf_url = PDF_URL;
  });

  afterEach(() => {
    (mockSubmissaoDetalhe as { pdf_url: string | null }).pdf_url = null;
  });

  it("renderiza <a target='_blank'> apontando para a URL absoluta do PDF", async () => {
    render(<SubmissaoDetalheView submissaoId={9002} />);

    const link = await waitFor(() =>
      screen.getByRole("link", { name: /Abrir em nova aba/i }),
    );

    expect(link).toHaveAttribute("href", PDF_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });
});
