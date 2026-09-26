import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import ApplicationsPage from "./applications";
import * as api from "./applications-schema";

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

  it("must display skeletons while loading the applications.", () => {
    vi.spyOn(api, "fetchApplications").mockImplementation(
      () => new Promise(() => {}),
    );

    const { container } = renderWithClient(<ApplicationsPage />);

    expect(
      screen.getByRole("heading", { name: /applications/i }),
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("must display an error message when the search fails", async () => {
    vi.spyOn(api, "fetchApplications").mockRejectedValue(
      new Error("Network Error"),
    );

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Ocorreu um erro ao carregar suas candidaturas. Tente novamente mais tarde./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("must list the successfully received applications", async () => {
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Enviada em 4 de agosto · 15 dias em processo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Em análise. A LogiBrás costuma responder em até 20 dias./i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Coordenador de Projetos · Vitalis/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Encerrada em 12 de agosto · você não foi selecionado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 vagas parecidas/i)).toBeInTheDocument();
  });

  it("must filter the list of applications based on the company search", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByRole("textbox", {
      name: /search for comany name/i,
    });

    await user.type(searchInput, "Tech");

    expect(
      screen.getByText(/Gerente de Operações · TechCorp/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Analista Administrativo · LogiBrás/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Project Coordinator · Vitalis/i),
    ).not.toBeInTheDocument();
  });

  it("must show the message of empty list if the search don't find any results", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByRole("textbox", {
      name: /search for company name/i,
    });

    await user.type(searchInput, "NonExistentCompany");

    expect(
      screen.getByText(/Nenhuma candidatura encontrada./i),
    ).toBeInTheDocument();
  });

  it("must show Zod validation error when the input exceeds 50 characters", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    const searchInput = screen.getByRole("textbox", {
      name: /search for company name/i,
    });

    const longText = "a".repeat(51);
    await user.type(searchInput, longText);

    await waitFor(() => {
      expect(
        screen.getByText(
          /O nome da empresa deve ter no máximo 50 caracteres./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("must open modal by clicking at 'Get out of the process' and enable to cancel", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Administrative Analist · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButtons = screen.getAllByRole("button", {
      name: /get out of process/i,
    });
    await user.click(quitButtons[0]!);

    expect(
      screen.getByRole("heading", { name: /are you certain about this\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone./i),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: /are you certain about that\?/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("must submit the withdrawal confirmation by clicking the confirmation button in the modal", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Administrative Analist · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButtons = screen.getAllByRole("button", {
      name: /get out of process/i,
    });
    await user.click(quitButtons[0]!);

    const confirmButton = screen.getByRole("button", {
      name: /^get out of process$/i,
    });

    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Saindo.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: /are you certain about that\?/i,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
