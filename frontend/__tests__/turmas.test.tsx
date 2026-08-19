import { render, screen, waitFor } from "@testing-library/react";

import TurmasPage from "@/app/dashboard/turmas/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("Página /dashboard/turmas", () => {
  it("renderiza cards de turmas com nome, escola e contagens", async () => {
    render(<TurmasPage />);

    await waitFor(() => {
      expect(screen.getByText(/9º Ano A/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Colégio Horizonte/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Alunos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Atividades/i).length).toBeGreaterThan(0);
  });
});
