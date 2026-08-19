import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubmissaoDetalheView } from "@/features/submissoes/submissao-detalhe";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("Override de submissão", () => {
  it("permite salvar override de nota e feedback", async () => {
    const user = userEvent.setup();
    render(<SubmissaoDetalheView submissaoId={9002} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Override da nota/i }),
      ).toBeInTheDocument(),
    );

    const notaInput = screen.getByLabelText(/Nota \(0 a 100\)/i);
    await user.clear(notaInput);
    await user.type(notaInput, "92");

    await user.clear(screen.getByLabelText(/Feedback do professor/i));
    await user.type(
      screen.getByLabelText(/Feedback do professor/i),
      "Bom raciocínio, atenção à conclusão.",
    );

    await user.click(screen.getByRole("button", { name: /Salvar override/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Override salvo com sucesso/i),
      ).toBeInTheDocument(),
    );
  });
});
