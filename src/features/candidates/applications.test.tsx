import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";

import { apiClient } from "@/lib/api-client";
import ApplicationsPage from "./applications";
import * as applicationsApi from "./applications-schema";

const mockApplications = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    job_id: "22222222-2222-2222-2222-222222222222",
    job_title: "Analista Administrativo",
    company_name: "LogiBrás",
    submitted_at: "2026-08-04T12:00:00.000Z",
    days_in_process: 15,
    status: "under_review" as const,
    similar_jobs: [],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    job_id: "44444444-4444-4444-4444-444444444444",
    job_title: "Coordenador de Projetos",
    company_name: "Vitalis",
    submitted_at: "2026-08-12T12:00:00.000Z",
    days_in_process: 0,
    status: "not_selected" as const,
    similar_jobs: [
      {
        id: "55555555-5555-5555-5555-555555555555",
        title: "Gerente de Projetos",
        company_name: "TechCorp",
      },
      {
        id: "66666666-6666-6666-6666-666666666666",
        title: "Coordenador de Projetos",
        company_name: "Outra Empresa",
      },
      {
        id: "77777777-7777-7777-7777-777777777777",
        title: "Analista de Projetos",
        company_name: "Empresa Exemplo",
      },
    ],
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    job_id: "99999999-9999-9999-9999-999999999999",
    job_title: "Gerente de Operações",
    company_name: "TechCorp",
    submitted_at: "2026-08-10T12:00:00.000Z",
    days_in_process: 10,
    status: "applied" as const,
    similar_jobs: [],
  },
];

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("ApplicationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("must display the loading state while applications are being fetched.", () => {
    vi.spyOn(applicationsApi, "fetchApplications").mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithClient(<ApplicationsPage />);

    expect(
      screen.getByRole("heading", { name: "Candidaturas" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("status", {
        name: /Carregando candidaturas/i,
      }),
    ).toBeInTheDocument();
  });

  it("must display an error message when loading applications fails", async () => {
    vi.spyOn(applicationsApi, "fetchApplications").mockRejectedValue(
      new Error("Network Error"),
    );

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Ocorreu um erro ao carregar suas candidaturas. Tente novamente mais tarde./i,
      );
    });
  });

  it("must list the successfully received applications", async () => {
    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    renderWithClient(<ApplicationsPage />);

    expect(
      await screen.findByText(/Analista Administrativo · LogiBrás/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Enviada em 4 de agosto · 15 dias em processo/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/Em análise/i)).toBeInTheDocument();

    expect(
      screen.getByText(/Coordenador de Projetos · Vitalis/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Você não foi selecionado/i)).toBeInTheDocument();
    expect(
      screen.getByText(/3 vagas parecidas abertas agora/i),
    ).toBeInTheDocument();
  });

  it("must filter the list of applications based on the company search", async () => {
    const user = userEvent.setup();

    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    renderWithClient(<ApplicationsPage />);

    expect(
      await screen.findByText(/Analista Administrativo · LogiBrás/i),
    ).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", {
      name: /Buscar por nome da empresa/i,
    });

    await user.type(searchInput, "Tech");
    await waitFor(() => {
      expect(
        screen.getByText(/Gerente de Operações · TechCorp/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Analista Administrativo · LogiBrás/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Coordenador de Projetos · Vitalis/i),
    ).not.toBeInTheDocument();
  });

  it("must show the message of empty list if the search don't find any results", async () => {
    const user = userEvent.setup();
    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByRole("textbox", {
      name: /Buscar por nome da empresa/i,
    });

    await user.type(searchInput, "NonExistentCompany");

    await waitFor(() => {
      expect(
        screen.getByText(/Nenhuma candidatura encontrada./i),
      ).toBeInTheDocument();
    });
  });

  it("must display a validation error when the search exceeds 50 characters", async () => {
    const user = userEvent.setup();
    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    renderWithClient(<ApplicationsPage />);

    const searchInput = screen.getByRole("textbox", {
      name: /Buscar por nome da empresa/i,
    });

    await user.type(searchInput, "a".repeat(51));

    await waitFor(() => {
      expect(
        screen.getByText(
          /O nome da empresa deve ter no máximo 50 caracteres./i,
        ),
      ).toBeInTheDocument();
    });

    expect(searchInput).toHaveAttribute("aria-invalid", "true");
    expect(searchInput).toHaveAttribute("aria-describedby", "search-error");
  });

  it("must open the withdrawal confirmation dialog and allow cancellation", async () => {
    const user = userEvent.setup();
    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButton = screen.getAllByRole("button", {
      name: /Sair do processo/i,
    });
    await user.click(quitButton[0]!);

    expect(
      screen.getByRole("heading", { name: /Você tem certeza\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Essa ação não pode ser desfeita. Você será removido do processo seletivo./i,
      ),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: /Você tem certeza?/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("must submit the withdrawal confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(applicationsApi, "fetchApplications").mockResolvedValue(
      mockApplications,
    );

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: {},
    });
    renderWithClient(<ApplicationsPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButton = screen.getAllByRole("button", {
      name: /Sair do processo/i,
    });
    await user.click(quitButton[0]!);

    const confirmButton = screen.getByRole("button", {
      name: /"Sair do processo"/i,
    });

    await user.click(confirmButton);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/applications/11111111-1111-1111-1111-111111111111/withdraw",
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: /Você tem certeza\?/i,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
