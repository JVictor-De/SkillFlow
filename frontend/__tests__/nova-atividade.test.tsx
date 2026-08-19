import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NovaAtividade } from "@/features/atividades/nova-atividade";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("NovaAtividade", () => {
  it("mostra campo de peso apenas quando o tipo é PROVA", async () => {
    const user = userEvent.setup();
    render(<NovaAtividade />);

    expect(screen.queryByLabelText(/Peso da prova/i)).toBeNull();
    const tipoSelect = await screen.findByLabelText(/Tipo da atividade/i);
    await user.selectOptions(tipoSelect, "PROVA");
    expect(screen.getByLabelText(/Peso da prova/i)).toBeInTheDocument();
  });

  it("oferece os 3 tipos de questão (múltipla, dissertativa texto, anexo PDF)", async () => {
    render(<NovaAtividade />);
    const tipoExercicio = await screen.findByLabelText(/^Tipo$/i);
    const opcoes = Array.from(tipoExercicio.querySelectorAll("option")).map(
      (o) => o.textContent,
    );
    expect(opcoes).toEqual(
      expect.arrayContaining([
        "Múltipla escolha",
        "Dissertativa (texto)",
        "Anexo (PDF)",
      ]),
    );
  });

  it("ao selecionar Dissertativa (texto), gabarito é texto livre e some alternativas", async () => {
    const user = userEvent.setup();
    render(<NovaAtividade />);
    const tipoEx = await screen.findByLabelText(/^Tipo$/i);
    await user.selectOptions(tipoEx, "DISSERTATIVA_TEXTO");
    // Alternativas (Alternativa A) somem.
    expect(screen.queryByLabelText(/Alternativa A/i)).toBeNull();
    // Gabarito vira input livre, não um select de letras.
    const gabarito = screen.getByLabelText(/^Gabarito/i);
    expect(gabarito.tagName).toBe("INPUT");
  });
});
