import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

describe("Landing Page", () => {
  beforeEach(() => {
    render(<HomePage />);
  });

  it("renderiza o hero com título principal e CTAs", () => {
    const heroHeadings = screen.getAllByRole("heading", { level: 1 });
    expect(
      heroHeadings.some((heading) =>
        /Menos correção/i.test(heading.textContent ?? ""),
      ),
    ).toBe(true);
    expect(
      heroHeadings.some((heading) =>
        /Mais impacto/i.test(heading.textContent ?? ""),
      ),
    ).toBe(true);

    expect(
      screen.getAllByRole("link", { name: /Agendar demonstração/i })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Log in/i })[0],
    ).toBeInTheDocument();
  });

  it("renderiza a seção 'Como funciona' com 4 etapas", () => {
    expect(
      screen.getByRole("heading", {
        name: /Implantado hoje\. Resultados visíveis esta semana/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Professor monta a avaliação em minutos/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Aluno responde de onde estiver/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/IA corrige e entrega feedback instantâneo/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Família acompanha\. Escola ganha reputação\./i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("renderiza a seção de features com cards principais", () => {
    expect(
      screen.getByText(/Professores livres da pilha de provas/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Decisões pedagógicas baseadas em dados/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Avaliação nova em 3 minutos, não em 3 horas/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pais engajados, escola mais forte/i),
    ).toBeInTheDocument();
  });

  it("renderiza CTA final repetindo a chamada para demo", () => {
    expect(
      screen.getByRole("heading", {
        name: /Veja o SkillFlow em ação e comprove os resultados/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Agendar demonstração gratuita/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Criar conta gratuita/i }),
    ).toBeInTheDocument();
  });
});
