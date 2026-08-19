import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TurmaDetalhe } from "@/features/turmas/turma-detalhe";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("TurmaDetalhe", () => {
  it("mostra a aba Ranking ao clicar e permite alternar configurações", async () => {
    const user = userEvent.setup();
    render(<TurmaDetalhe turmaId={10} />);

    const tab = await screen.findByRole("tab", { name: /Ranking/i });
    await user.click(tab);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Configurações de ranking/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/Ranking de pontuação/i)).toBeInTheDocument();
    expect(screen.getByText(/Ranking de provas/i)).toBeInTheDocument();
  });

  it("renderiza ranking real da turma com pontuações e posições (bug 1)", async () => {
    const user = userEvent.setup();
    render(<TurmaDetalhe turmaId={10} />);

    await user.click(await screen.findByRole("tab", { name: /Ranking/i }));

    // Card "Ranking atual" aparece com a lista posicionada — agora o
    // professor consegue ver os alunos mesmo no SaaS, e mesmo que parte
    // da turma esteja com pontuação 0.
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Ranking atual/i }),
      ).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId("ranking-list")).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId("ranking-list").querySelectorAll("li").length,
    ).toBeGreaterThan(0);
  });

  it("expõe botão de adicionar material e abre formulário (bug 2)", async () => {
    const user = userEvent.setup();
    render(<TurmaDetalhe turmaId={10} />);

    await user.click(await screen.findByRole("tab", { name: /Materiais/i }));
    const toggle = await screen.findByTestId("material-toggle-form");
    expect(toggle.textContent).toMatch(/Adicionar material/i);
    expect(screen.queryByTestId("material-form")).toBeNull();

    await user.click(toggle);

    expect(screen.getByTestId("material-form")).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Arquivo \(PDF\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Salvar material/i }),
    ).toBeInTheDocument();
  });
});
