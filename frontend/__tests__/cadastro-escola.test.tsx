import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CadastroEscolaForm } from "@/features/auth/cadastro-escola-form";

const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: replaceMock }),
}));

describe("CadastroEscolaForm", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    window.localStorage.clear();
  });

  it("cria escola e coordenador e redireciona para /dashboard", async () => {
    const user = userEvent.setup();
    render(<CadastroEscolaForm />);

    await user.type(screen.getByLabelText(/Nome da escola/i), "Escola Aurora");
    await user.type(screen.getByLabelText(/CNPJ/i), "12.345.678/0001-90");
    await user.type(screen.getByLabelText(/Nome completo/i), "Maria Coord");
    await user.type(
      screen.getByLabelText("E-mail"),
      "maria@escolaaurora.dev",
    );
    await user.type(screen.getByLabelText("Senha"), "senhaForte!8");
    await user.click(
      screen.getByRole("button", { name: /Criar conta da escola/i }),
    );

    await screen.findByRole("button", { name: /Criar conta da escola/i });
    await new Promise((r) => setTimeout(r, 700));
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });
});
