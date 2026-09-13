import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfessionalRegister } from "@/features/professional-register";
import { apiClient } from "@/lib/api-client";

// Mock do apiClient para testes de submissão do formulário
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("ProfessionalRegister - Testes de Integração, Validação e Cobertura", () => {
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

  it("deve rejeitar se a idade for inferior a 45 anos devido a aniversário ainda não ocorrido no ano corrente", async () => {
    const user = userEvent.setup();
    render(<ProfessionalRegister />);

    const today = new Date();
    const targetYear = today.getFullYear() - 45;
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 1);

    const monthStr = String(futureDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(futureDate.getDate()).padStart(2, "0");
    const birthDateStr = `${targetYear}-${monthStr}-${dayStr}`;

    const birthInput = screen.getByLabelText(/data de nascimento/i);
    fireEvent.change(birthInput, { target: { value: birthDateStr } });

    await user.click(screen.getByLabelText(/li e aceito os termos/i));
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(
      await screen.findByText("A idade mínima para cadastro é de 45 anos."),
    ).toBeInTheDocument();
  });

  it("deve aplicar a máscara adequada para telefone celular com 11 dígitos (Linhas 124-138)", async () => {
    const user = userEvent.setup();
    render(<ProfessionalRegister />);

    const phoneInput = screen.getByLabelText(/telefone/i);
    await user.type(phoneInput, "11988887777");

    expect(phoneInput).toHaveValue("(11) 98888-7777");
  });

  it("deve tratar resposta HTTP de erro na busca do CEP", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ProfessionalRegister />);

    await user.type(screen.getByLabelText(/cep/i), "01001000");

    expect(
      await screen.findByText(
        "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
      ),
    ).toBeInTheDocument();
  });

  it("deve submeter o formulário com sucesso e redirecionar para a página de login", async () => {
    const user = userEvent.setup();

    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
      assign: vi.fn(),
    });

    const postSpy = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ status: 200 });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        Promise.resolve({
          logradouro: "Rua A",
          bairro: "Bairro B",
          localidade: "Cidade C",
          uf: "SP",
        }),
    });

    render(<ProfessionalRegister />);

    await user.type(screen.getByLabelText(/nome completo/i), "Carlos Silva");
    await user.type(screen.getByLabelText(/cpf/i), "12345678901");

    fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
      target: { value: "1970-01-01" },
    });

    await user.type(screen.getByLabelText(/telefone/i), "11988887777");
    await user.type(screen.getByLabelText(/e-mail/i), "carlos@email.com");
    await user.type(screen.getByLabelText(/cep/i), "01001000");

    await screen.findByText("Endereço encontrado.");

    await user.type(screen.getByLabelText(/^senha/i), "Senha123!");
    await user.type(screen.getByLabelText(/confirmar senha/i), "Senha123!");

    await user.click(screen.getByLabelText(/li e aceito os termos/i));
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/professionals/register",
        expect.anything(),
      );
    });

    locationSpy.mockRestore();
  });
});
