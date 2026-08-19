import { render, screen, waitFor } from "@testing-library/react";

import { SiteHeader } from "@/components/site/site-header";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const STORAGE_KEY = "skillflow.user";

describe("SiteHeader", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("mostra Log in / Agendar demonstração quando não há sessão", async () => {
    render(<SiteHeader />);
    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: /Log in/i })[0],
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByRole("link", { name: /Agendar demonstração/i })[0],
    ).toBeInTheDocument();
    expect(screen.queryByTestId("site-header-dashboard")).toBeNull();
  });

  it("mostra avatar + dashboard quando o professor está logado (bug 6)", async () => {
    const user = {
      id: 1,
      email: "ana@skillflow.dev",
      nome: "Ana Pereira",
      role: "PROFESSOR" as const,
      must_change_password: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    render(<SiteHeader />);
    // Após hidratação, header reconhece a sessão e troca a CTA pelo
    // bloco "Painel" + Sair, em vez de mostrar Log in falsamente.
    await waitFor(() =>
      expect(screen.queryByTestId("site-header-dashboard")).toBeInTheDocument(),
    );
    const dashLink = screen.getByTestId(
      "site-header-dashboard",
    ) as HTMLAnchorElement;
    expect(dashLink.getAttribute("href")).toBe("/dashboard");
    expect(dashLink.textContent).toMatch(/Ana Pereira/);
    expect(dashLink.textContent).toMatch(/Professor/);
    // Não deve mais existir CTA "Log in" no header desktop quando o
    // professor está autenticado.
    expect(screen.queryAllByRole("link", { name: /^Log in$/i })).toHaveLength(
      0,
    );
  });

  it("ignora sessão de aluno (sem painel SaaS)", async () => {
    const user = {
      id: 9,
      email: "aluno@skillflow.dev",
      nome: "Aluno",
      role: "ALUNO" as const,
      must_change_password: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    render(<SiteHeader />);
    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: /Log in/i })[0],
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("site-header-dashboard")).toBeNull();
  });
});
