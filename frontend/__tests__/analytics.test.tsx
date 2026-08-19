import { render, screen, waitFor } from "@testing-library/react";

import AnalyticsPage from "@/app/dashboard/analytics/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// recharts requires ResizeObserver in jsdom
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

describe("AnalyticsPage", () => {
  it("renderiza gráficos de erro e disciplina ao carregar a turma padrão", async () => {
    render(<AnalyticsPage />);

    await waitFor(
      () => {
        expect(screen.getByTestId("error-chart")).toBeInTheDocument();
        expect(screen.getByTestId("discipline-chart")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
