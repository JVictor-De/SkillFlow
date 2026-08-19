import { render, screen } from "@testing-library/react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { AuthUser } from "@/types";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/turmas",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

const baseUser: AuthUser = {
  id: 1,
  email: "p@p.com",
  nome: "Profe",
  role: "PROFESSOR",
  must_change_password: false,
};

describe("DashboardSidebar", () => {
  it("oculta links exclusivos do coordenador para professor", () => {
    render(<DashboardSidebar user={baseUser} />);
    expect(screen.getByRole("link", { name: /Turmas/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Professores/i })).toBeNull();
    expect(
      screen.queryByRole("link", { name: /Responsáveis/i }),
    ).toBeNull();
  });

  it("mostra todos os links para coordenador", () => {
    render(
      <DashboardSidebar user={{ ...baseUser, role: "COORDENADOR" }} />,
    );
    expect(screen.getByRole("link", { name: /Professores/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Responsáveis/i }),
    ).toBeInTheDocument();
  });

  it("aplica fonte e padding aumentados nos itens do menu", () => {
    render(<DashboardSidebar user={baseUser} />);
    const link = screen.getByRole("link", { name: /Turmas/i });
    // Tipografia e espaçamento alinhados com a especificação do bug 6
    // (fonte e ícones maiores no menu lateral, mantendo responsividade).
    expect(link.className).toContain("text-base");
    expect(link.className).toContain("py-3");
    const icon = link.querySelector("svg");
    expect(icon?.getAttribute("width")).toBe("22");
  });

  it("renderiza nome, papel e botão Sair em branco no card de sessão", () => {
    // Bug 3 do briefing: textos do bloco de usuário logado precisam ser
    // brancos para ter contraste com o fundo escuro da sidebar.
    const user: AuthUser = { ...baseUser, nome: "Ana Pereira" };
    render(<DashboardSidebar user={user} />);
    const card = screen.getByTestId("sidebar-user-card");
    expect(card.className).toContain("text-white");
    const nome = screen.getByText("Ana Pereira");
    expect(nome.className).toContain("text-white");
    const papel = screen.getByText(/Professor/);
    expect(papel.className).toContain("text-white/70");
    const sair = screen.getByRole("button", { name: /Sair/i });
    expect(sair.className).toContain("text-white");
  });
});
