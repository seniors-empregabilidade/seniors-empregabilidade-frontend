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

  it("deve exibir os skeletons enquanto está carregando as candidaturas", () => {
    vi.spyOn(api, "fetchApplications").mockImplementation(
      () => new Promise(() => {}),
    );

    const { container } = renderWithClient(<ApplicationsPage />);

    expect(
      screen.getByRole("heading", { name: /candidaturas/i }),
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("deve exibir mensagem de erro quando a busca falhar", async () => {
    vi.spyOn(api, "fetchApplications").mockRejectedValue(
      new Error("Erro de rede"),
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

  it("deve listar as candidaturas recebidas com sucesso", async () => {
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    // Aguarda o carregamento das vagas
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

    // Vaga com status CLOSED
    expect(
      screen.getByText(/Coordenador de Projetos · Vitalis/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Encerrada em 12 de agosto · você não foi selecionado/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 vagas parecidas/i)).toBeInTheDocument();
  });

  it("deve filtrar a lista de candidaturas com base na busca por empresa", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByRole("textbox", {
      name: /buscar por nome da empresa/i,
    });

    await user.type(searchInput, "Tech");

    expect(
      screen.getByText(/Gerente de Operações · TechCorp/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Analista Administrativo · LogiBrás/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Coordenador de Projetos · Vitalis/i),
    ).not.toBeInTheDocument();
  });

  it("deve exibir a mensagem de lista vazia se a busca não encontrar resultados", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByRole("textbox", {
      name: /buscar por nome da empresa/i,
    });

    await user.type(searchInput, "EmpresaInexistente");

    expect(
      screen.getByText(/Nenhuma candidatura encontrada./i),
    ).toBeInTheDocument();
  });

  it("deve exibir erro de validação do Zod quando o input passar de 50 caracteres", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    const searchInput = screen.getByRole("textbox", {
      name: /buscar por nome da empresa/i,
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

  it("deve abrir o modal ao clicar em 'Sair do processo' e permitir cancelar", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButtons = screen.getAllByRole("button", {
      name: /sair do processo/i,
    });
    await user.click(quitButtons[0]!);

    expect(
      screen.getByRole("heading", { name: /você tem certeza\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Essa ação não pode ser desfeita./i),
    ).toBeInTheDocument();

    // Clica em Cancelar
    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    // Modal deve sumir
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /você tem certeza\?/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("deve submeter a confirmação de desistência do processo ao clicar no botão de confirmação do modal", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchApplications").mockResolvedValue(api.mockApplications);

    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Analista Administrativo · LogiBrás/i),
      ).toBeInTheDocument();
    });

    const quitButtons = screen.getAllByRole("button", {
      name: /sair do processo/i,
    });
    await user.click(quitButtons[0]!);

    const confirmButton = screen.getByRole("button", {
      name: /^sair do processo$/i,
    });

    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/Saindo.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /você tem certeza\?/i }),
      ).not.toBeInTheDocument();
    });
  });
});
