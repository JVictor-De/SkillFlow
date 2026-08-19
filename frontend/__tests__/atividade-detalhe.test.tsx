import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AtividadeDetalhe } from "@/features/atividades/atividade-detalhe";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("AtividadeDetalhe", () => {
  it("mostra botões fechar/excluir prova e exige confirmação (bug 4)", async () => {
    const user = userEvent.setup();
    // Mock id 501 → "Prova Bimestral - Funções" (PUBLICADO no fixture)
    render(<AtividadeDetalhe atividadeId={501} />);

    await screen.findByRole("heading", { name: /Prova Bimestral/i });

    const fecharBtn = screen.getByTestId("atividade-fechar");
    const excluirBtn = screen.getByTestId("atividade-excluir");
    expect(fecharBtn).toBeInTheDocument();
    expect(excluirBtn).toBeInTheDocument();

    await user.click(fecharBtn);
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Fechar a prova/i)).toBeInTheDocument();
    // Cancelar fecha o diálogo sem ação.
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));
    await waitFor(() => expect(screen.queryByTestId("confirm-dialog")).toBeNull());

    await user.click(excluirBtn);
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Excluir esta atividade/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sim, excluir/i }),
    ).toBeInTheDocument();
  });
});
