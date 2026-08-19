import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CadastrarTurmaPage from "@/app/dashboard/turmas/cadastrar/page";
import TurmasPage from "@/app/dashboard/turmas/page";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: pushMock, push: pushMock }),
}));

describe("Cadastro de turma", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("listagem expõe botão 'Cadastrar Turma' apontando para /dashboard/turmas/cadastrar", async () => {
    render(<TurmasPage />);

    const link = await screen.findByRole("link", { name: /Cadastrar Turma/i });
    expect(link).toHaveAttribute("href", "/dashboard/turmas/cadastrar");
  });

  it("cria nova turma e redireciona para a listagem", async () => {
    const user = userEvent.setup();
    render(<CadastrarTurmaPage />);

    expect(
      screen.getByRole("heading", { name: /Cadastrar turma/i }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Nome da turma/i);
    await user.type(input, "9º Ano D");

    await user.click(screen.getByRole("button", { name: /Criar turma/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard/turmas");
    });
  });

  it("não envia o formulário quando o nome está vazio", async () => {
    const user = userEvent.setup();
    render(<CadastrarTurmaPage />);

    await user.click(screen.getByRole("button", { name: /Criar turma/i }));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
