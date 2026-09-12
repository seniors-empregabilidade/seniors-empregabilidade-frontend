import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfessionalRegister } from "@/features/professional-register";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

describe("ProfessionalRegister - Testes de Integração e CEP", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("deve exibir mensagens de erro e aplicar foco no primeiro campo inválido ao submeter", async () => {
    const user = userEvent.setup();

    render(<ProfessionalRegister />);

    await user.click(screen.getByLabelText(/li e aceito os termos/i));

    await user.click(
      screen.getByRole("button", {
        name: /criar conta/i,
      }),
    );

    expect(
      await screen.findByText("Informe seu nome completo."),
    ).toBeInTheDocument();

    expect(screen.getByText("Informe seu CPF.")).toBeInTheDocument();

    expect(screen.getByLabelText(/nome completo/i)).toHaveFocus();
  });

  it("deve preservar os dados digitados enquanto exibe erros de validação", async () => {
    const user = userEvent.setup();

    render(<ProfessionalRegister />);

    const nameInput = screen.getByLabelText(/nome completo/i);

    await user.type(nameInput, "Carlos Silva");

    await user.click(screen.getByLabelText(/li e aceito os termos/i));

    await user.click(
      screen.getByRole("button", {
        name: /criar conta/i,
      }),
    );

    expect(nameInput).toHaveValue("Carlos Silva");

    expect(await screen.findByText("Informe seu CPF.")).toBeInTheDocument();
  });

  it("deve habilitar e desabilitar o botão com base no aceite dos termos", async () => {
    const user = userEvent.setup();

    render(<ProfessionalRegister />);

    const submitBtn = screen.getByRole("button", {
      name: /criar conta/i,
    });

    const termsCheckbox = screen.getByLabelText(/li e aceito os termos/i);

    expect(submitBtn).toBeDisabled();

    await user.click(termsCheckbox);

    expect(submitBtn).toBeEnabled();

    await user.click(termsCheckbox);

    expect(submitBtn).toBeDisabled();
  });

  it("deve preencher o endereço automaticamente quando o CEP for válido", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          logradouro: "Praça da Sé",
          bairro: "Sé",
          localidade: "São Paulo",
          uf: "SP",
        }),
    });

    render(<ProfessionalRegister />);

    const cepInput = screen.getByLabelText(/cep/i);

    await user.type(cepInput, "01001000");

    expect(await screen.findByText("Endereço encontrado.")).toBeInTheDocument();

    expect(screen.getByLabelText(/logradouro/i)).toHaveValue("Praça da Sé");

    expect(screen.getByLabelText(/^cidade$/i)).toHaveValue("São Paulo");
  });

  it("deve exibir mensagem de erro quando o CEP for inexistente", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          erro: true,
        }),
    });

    render(<ProfessionalRegister />);

    await user.type(screen.getByLabelText(/cep/i), "99999999");

    expect(
      await screen.findByText(
        "CEP não encontrado. Verifique os números e tente novamente.",
      ),
    ).toBeInTheDocument();
  });

  it("deve tratar erro de serviço/rede ao consultar CEP", async () => {
    const user = userEvent.setup();

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    render(<ProfessionalRegister />);

    await user.type(screen.getByLabelText(/cep/i), "01001000");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText(
        "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
      ),
    ).toBeInTheDocument();
  });

  it("deve ignorar a resposta da primeira consulta quando o CEP é alterado para outro válido", async () => {
    const user = userEvent.setup();

    let resolveFirstFetch!: (value: unknown) => void;
    let resolveSecondFetch!: (value: unknown) => void;

    const firstFetchPromise = new Promise((resolve) => {
      resolveFirstFetch = resolve;
    });

    const secondFetchPromise = new Promise((resolve) => {
      resolveSecondFetch = resolve;
    });

    mockFetch
      .mockImplementationOnce(() => firstFetchPromise)
      .mockImplementationOnce(() => secondFetchPromise);

    render(<ProfessionalRegister />);

    const cepInput = screen.getByLabelText(/cep/i);

    await user.type(cepInput, "01001000");

    await user.clear(cepInput);
    await user.type(cepInput, "20040007");

    resolveSecondFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          logradouro: "Rua da Assembleia",
          bairro: "Centro",
          localidade: "Rio de Janeiro",
          uf: "RJ",
        }),
    });

    expect(await screen.findByLabelText(/^cidade$/i)).toHaveValue(
      "Rio de Janeiro",
    );

    resolveFirstFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          logradouro: "Praça da Sé",
          bairro: "Sé",
          localidade: "São Paulo",
          uf: "SP",
        }),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^cidade$/i)).toHaveValue("Rio de Janeiro");

      expect(screen.getByLabelText(/logradouro/i)).toHaveValue(
        "Rua da Assembleia",
      );
    });
  });

  it("deve cancelar a consulta e limpar o endereço se o CEP for apagado no meio do carregamento", async () => {
    const user = userEvent.setup();

    let resolveFetch!: (value: unknown) => void;

    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    mockFetch.mockImplementationOnce(() => fetchPromise);

    render(<ProfessionalRegister />);

    const cepInput = screen.getByLabelText(/cep/i);

    await user.type(cepInput, "01001000");

    expect(screen.getByText("Consultando CEP...")).toBeInTheDocument();

    await user.clear(cepInput);

    resolveFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          logradouro: "Praça da Sé",
          bairro: "Sé",
          localidade: "São Paulo",
          uf: "SP",
        }),
    });

    await waitFor(() => {
      expect(screen.queryByText("Consultando CEP...")).not.toBeInTheDocument();

      expect(
        screen.queryByText("Endereço encontrado."),
      ).not.toBeInTheDocument();

      expect(screen.getByLabelText(/logradouro/i)).toHaveValue("");
    });
  });
});
