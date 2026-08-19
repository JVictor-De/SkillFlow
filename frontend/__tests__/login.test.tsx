import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/features/auth/login-form";

const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: replaceMock }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    window.localStorage.clear();
    document.cookie = "skillflow.session_hint=; Path=/; Max-Age=0";
  });

  it("rejeita tentativa de login de aluno/responsável", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-mail/i), "patricia.alb@skillflow.dev");
    await user.type(screen.getByLabelText("Senha"), "qualquercoisa");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/i }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redireciona docente para /dashboard quando login OK", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/E-mail/i),
      "professor@skillflow.dev",
    );
    await user.type(screen.getByLabelText("Senha"), "abcd1234");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/i }),
    );

    await screen.findByRole("button", { name: /Entrar na plataforma/i });
    await new Promise((r) => setTimeout(r, 400));
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });

  it("redireciona para /trocar-senha quando must_change_password=true", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/E-mail/i), "novato@skillflow.dev");
    await user.type(screen.getByLabelText("Senha"), "abcd1234");
    await user.click(
      screen.getByRole("button", { name: /Entrar na plataforma/i }),
    );

    await screen.findByRole("button", { name: /Entrar na plataforma/i });
    await new Promise((r) => setTimeout(r, 400));
    expect(replaceMock).toHaveBeenCalledWith("/trocar-senha");
  });
});
