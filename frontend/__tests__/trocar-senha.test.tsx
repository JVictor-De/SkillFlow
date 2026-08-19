import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TrocarSenhaForm } from "@/features/auth/trocar-senha-form";

const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: replaceMock }),
}));

describe("TrocarSenhaForm", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    window.localStorage.clear();
  });

  it("redireciona para /dashboard após troca bem sucedida (must_change_password)", async () => {
    const user = userEvent.setup();
    render(<TrocarSenhaForm />);

    await user.type(screen.getByLabelText(/Senha atual/i), "old-pass");
    await user.type(screen.getByLabelText(/^Nova senha$/i), "novaForte!9");
    await user.type(
      screen.getByLabelText(/Confirmar nova senha/i),
      "novaForte!9",
    );
    await user.click(screen.getByRole("button", { name: /Atualizar senha/i }));

    await screen.findByRole("button", { name: /Atualizar senha/i });
    await new Promise((r) => setTimeout(r, 500));
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });
});
