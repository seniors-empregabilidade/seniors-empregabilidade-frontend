import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cleanup,
  render as renderComponent,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfessionalRegister } from "./professional-register";
import { ApiError } from "@/lib/api-error";
import { apiClient } from "@/lib/api-client";
import { readPendingEmail } from "@/lib/pending-email";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function render(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return renderComponent(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

async function submitValidRegistration(
  user: ReturnType<typeof userEvent.setup>,
  password = "Senha123!",
  onEmailVerificationRequired?: (email: string) => void | Promise<void>,
) {
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

  render(
    <ProfessionalRegister
      {...(onEmailVerificationRequired ? { onEmailVerificationRequired } : {})}
    />,
  );

  await user.type(screen.getByLabelText(/nome completo/i), "Carlos Silva");
  await user.type(screen.getByLabelText(/cpf/i), "12345678901");

  fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
    target: { value: "1970-01-01" },
  });

  await user.type(screen.getByLabelText(/telefone/i), "11988887777");
  await user.type(screen.getByLabelText(/e-mail/i), "carlos@example.com");
  await user.type(screen.getByLabelText(/cep/i), "01001000");

  await screen.findByText("Endereço encontrado.");

  await user.type(screen.getByLabelText(/^senha/i), password);
  await user.type(screen.getByLabelText(/confirmar senha/i), password);

  await user.click(screen.getByLabelText(/li e aceito os termos/i));
  await user.click(screen.getByRole("button", { name: /criar conta/i }));
}

describe("ProfessionalRegister - Testes de Integração, Validação e Cobertura", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  it.each([
    ["Aa1!abc", "A senha deve ter no mínimo 8 caracteres."],
    ["synthetic123!", "Inclua pelo menos uma letra maiúscula na senha."],
    ["SYNTHETIC123!", "Inclua pelo menos uma letra minúscula na senha."],
    ["Synthetic!", "Inclua pelo menos um número na senha."],
    ["Synthetic123", "Inclua pelo menos um símbolo na senha, como !, @ ou #."],
  ])(
    "blocks the request and focuses an invalid password: %s",
    async (password, message) => {
      const user = userEvent.setup();
      const post = vi.spyOn(apiClient, "post");
      await submitValidRegistration(user, password);
      expect(await screen.findByText(message)).toBeVisible();
      const input = screen.getByLabelText(/^senha/i);
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute(
        "aria-describedby",
        "password-hint password-error",
      );
      expect(input).toHaveAccessibleDescription(
        expect.stringContaining(message),
      );
      expect(input).toHaveAccessibleDescription(
        expect.stringContaining("Use no mínimo 8 caracteres"),
      );
      expect(post).not.toHaveBeenCalled();
    },
  );

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

  it("submits the exact registration body and continues to email verification", async () => {
    const user = userEvent.setup();
    const onEmailVerificationRequired = vi.fn();

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      status: 201,
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        full_name: "Pessoa Teste",
        email: "pessoa@example.com",
        email_verification_required: true,
      },
    });

    const beforeSubmission = Date.now();
    await submitValidRegistration(
      user,
      "Senha123!",
      onEmailVerificationRequired,
    );

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/professionals", {
        full_name: "Carlos Silva",
        cpf: "12345678901",
        birth_date: "1970-01-01",
        phone: "11988887777",
        email: "carlos@example.com",
        password: "Senha123!",
        terms_version_accepted: "v1",
        city: "Cidade C",
        state: "SP",
      });
    });

    await waitFor(() =>
      expect(onEmailVerificationRequired).toHaveBeenCalledWith(
        "pessoa@example.com",
      ),
    );
    const pendingEmail = readPendingEmail();
    expect(pendingEmail?.email).toBe("pessoa@example.com");
    expect(typeof pendingEmail?.resendAvailableAt).toBe("number");
    expect(pendingEmail?.resendAvailableAt).toBeGreaterThanOrEqual(
      beforeSubmission + 59_000,
    );
    expect(
      screen.queryByRole("link", { name: "Ir para o login" }),
    ).not.toBeInTheDocument();
  });
  it("maps invalid_cpf without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "invalid_cpf",
        status: 422,
        errors: { "body.cpf": ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() => expect(document.getElementById("cpf")).toHaveFocus());
    expect(document.getElementById("cpf")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("cpf-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
  });

  it("maps minimum_age_not_met without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "minimum_age_not_met",
        status: 422,
        errors: { birth_date: ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() =>
      expect(document.getElementById("birthDate")).toHaveFocus(),
    );
    expect(document.getElementById("birthDate")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("birthDate-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
  });

  it("maps email_already_registered without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "email_already_registered",
        status: 409,
        errors: { "body.email": ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() => expect(document.getElementById("email")).toHaveFocus());
    expect(document.getElementById("email")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("email-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Entrar na minha conta" }),
    ).toHaveAttribute("href", "/login");
  });

  it("maps cpf_already_registered without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "cpf_already_registered",
        status: 409,
        errors: { cpf: ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() => expect(document.getElementById("cpf")).toHaveFocus());
    expect(document.getElementById("cpf")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("cpf-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Entrar na minha conta" }),
    ).toHaveAttribute("href", "/login");
  });

  it("maps terms_acceptance_required without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "terms_acceptance_required",
        status: 422,
        errors: { "body.terms_version_accepted": ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() =>
      expect(document.getElementById("acceptedTerms")).toHaveFocus(),
    );
    expect(document.getElementById("acceptedTerms")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("acceptedTerms-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
  });

  it("maps validation_error without server text", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({
        message: "TECHNICAL SECRET",
        code: "validation_error",
        status: 422,
        errors: { "body.full_name": ["TECHNICAL SECRET"] },
      }),
    );
    await submitValidRegistration(user);

    await waitFor(() => expect(document.getElementById("name")).toHaveFocus());
    expect(document.getElementById("name")).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("name-error"),
    );
    expect(screen.queryByText("TECHNICAL SECRET")).not.toBeInTheDocument();
  });
  it("confirms an already verified account without sending again", async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        full_name: "Pessoa Teste",
        email: "pessoa@example.com",
        email_verification_required: false,
      },
    });
    await submitValidRegistration(user);
    expect(
      await screen.findByText(
        "Sua conta foi criada. Você já pode entrar com seu e-mail e senha.",
      ),
    ).toBeVisible();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("announces and focuses a general server failure", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({ message: "PRIVATE", code: "internal_error", status: 500 }),
    );
    await submitValidRegistration(user);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(screen.queryByText("PRIVATE")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo/i)).toHaveValue("Carlos Silva");
  });
});
