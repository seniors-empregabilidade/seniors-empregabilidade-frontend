import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  render as renderComponent,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import { CompanyJobsPage } from "./company-jobs-page";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const openJob = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Analista de Operações",
  work_mode: "remote",
  closing_date: "2026-12-31",
  status: "published",
};

const closedJob = {
  id: "00000000-0000-4000-8000-000000000002",
  title: "Coordenador de Logística",
  work_mode: "onsite",
  closing_date: "2026-11-30",
  status: "paused",
};

function render(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderComponent(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CompanyJobsPage", () => {
  it("lists the company jobs with status and open count", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: [openJob, closedJob],
    });

    render(<CompanyJobsPage />);

    expect(
      await screen.findByRole("heading", { name: "Analista de Operações" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coordenador de Logística")).toBeInTheDocument();
    expect(screen.getByText("Aberta")).toBeInTheDocument();
    expect(screen.getByText("Encerrada")).toBeInTheDocument();
    expect(screen.getByText("1 vaga em aberto")).toBeInTheDocument();
  });

  it("shows a loading state before the jobs arrive", () => {
    vi.spyOn(apiClient, "get").mockReturnValue(new Promise(() => {}));

    render(<CompanyJobsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
  });

  it("shows an empty state when the company has no jobs", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

    render(<CompanyJobsPage />);

    expect(
      await screen.findByText("Nenhuma vaga publicada."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 vagas em aberto")).toBeInTheDocument();
  });

  it("shows an error state with a retry action", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(
      new ApiError({
        message: "falhou",
        code: "invalid_company_jobs_response",
      }),
    );

    render(<CompanyJobsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as suas vagas.",
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });

  it("asks for confirmation before closing a job", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [openJob] });
    const patch = vi.spyOn(apiClient, "patch");
    const user = userEvent.setup();

    render(<CompanyJobsPage />);
    await user.click(await screen.findByRole("button", { name: "Encerrar" }));

    expect(
      screen.getByRole("heading", { name: "Encerrar vaga" }),
    ).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(patch).not.toHaveBeenCalled();
  });

  it("closes the job after the confirmation", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [openJob] });
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: { ...openJob, status: "paused" },
    });
    const user = userEvent.setup();

    render(<CompanyJobsPage />);
    await user.click(await screen.findByRole("button", { name: "Encerrar" }));
    await user.click(screen.getByRole("button", { name: "Encerrar vaga" }));

    expect(patch).toHaveBeenCalledWith(`/jobs/${openJob.id}/status`, {
      status: "paused",
    });
  });

  it("reopens a closed job without confirmation", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [closedJob] });
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: { ...closedJob, status: "published" },
    });
    const user = userEvent.setup();

    render(<CompanyJobsPage />);
    await user.click(await screen.findByRole("button", { name: "Reabrir" }));

    expect(patch).toHaveBeenCalledWith(`/jobs/${closedJob.id}/status`, {
      status: "published",
    });
  });

  it("keeps the edit action disabled until the edit screen exists", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [openJob] });

    render(<CompanyJobsPage />);

    expect(
      await screen.findByRole("button", { name: "Editar" }),
    ).toBeDisabled();
  });
});
