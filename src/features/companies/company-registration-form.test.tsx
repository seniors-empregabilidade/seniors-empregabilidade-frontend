import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";

import * as api from "./company-api";
import { CompanyRegistrationForm } from "./company-registration-form";

vi.mock("./company-api", () => ({
  getCompanyRecord: vi.fn(),
  getPostalAddress: vi.fn(),
  registerCompany: vi.fn(),
  confirmCompanyEmail: vi.fn(),
  resendCompanyCode: vi.fn(),
}));
const created = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "contact@synthetic.invalid",
  status: "pending" as const,
  email_confirmation_required: true,
};
function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompanyRegistrationForm />
    </QueryClientProvider>,
  );
}
function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
async function fillValidForm() {
  fill("Nome da empresa *", "Synthetic Company");
  fill("CNPJ *", "11222333000181");
  fill("CEP *", "12345678");
  await waitFor(() =>
    expect(screen.getByLabelText("Cidade *")).toHaveValue("Synthetic City"),
  );
  fill("Número *", "42");
  fill("E-mail corporativo *", created.email);
  fill("Senha *", "SyntheticPass!2026");
  fill("Confirmar senha *", "SyntheticPass!2026");
  fireEvent.click(screen.getByRole("checkbox"));
}
async function submit() {
  await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getCompanyRecord).mockResolvedValue({
    cnpj: "11222333000181",
    legal_name: "Synthetic Registry SA",
    trade_name: null,
    primary_cnae: "6201501",
  });
  vi.mocked(api.getPostalAddress).mockResolvedValue({
    cep: "12345-678",
    logradouro: "Synthetic Street",
    bairro: "Synthetic District",
    localidade: "Synthetic City",
    uf: "RS",
  });
  vi.mocked(api.registerCompany).mockResolvedValue(created);
  vi.mocked(api.confirmCompanyEmail).mockResolvedValue(undefined);
  vi.mocked(api.resendCompanyCode).mockResolvedValue(undefined);
});

describe("Company registration", () => {
  it("preserves the address when only CEP formatting changes", async () => {
    mount();
    await fillValidForm();
    fill("CEP *", "12345-678");
    expect(screen.getByLabelText("Cidade *")).toHaveValue("Synthetic City");
    await submit();
    expect(await screen.findByText("Cadastro recebido")).toBeInTheDocument();
    expect(api.getPostalAddress).toHaveBeenCalledTimes(1);
  });

  it("replaces an old address when another CEP is selected", async () => {
    mount();
    await fillValidForm();
    vi.mocked(api.getPostalAddress).mockResolvedValueOnce({
      cep: "87654-321",
      logradouro: "Another Street",
      bairro: "Another District",
      localidade: "Another City",
      uf: "SC",
    });
    fill("CEP *", "87654321");
    expect(screen.getByLabelText("Cidade *")).toHaveValue("");
    await waitFor(() =>
      expect(screen.getByLabelText("Cidade *")).toHaveValue("Another City"),
    );
    fill("CEP *", "12345678");
    await waitFor(() =>
      expect(screen.getByLabelText("Cidade *")).toHaveValue("Synthetic City"),
    );
  });

  it("requires terms and fills registry/address before registering a pending company", async () => {
    mount();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeDisabled();
    await fillValidForm();
    expect(screen.getByLabelText("Razão social")).toHaveValue(
      "Synthetic Registry SA",
    );
    expect(screen.getByLabelText("Ramo de atividade (CNAE)")).toHaveValue(
      "6201501",
    );
    await submit();
    expect(
      await screen.findByRole("heading", { name: "Cadastro recebido" }),
    ).toHaveFocus();
    expect(api.registerCompany).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Sua empresa está pendente/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha *")).not.toBeInTheDocument();
    fill("Código de confirmação", "123456");
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar e-mail" }),
    );
    expect(await screen.findByText(/E-mail confirmado/)).toHaveFocus();
    expect(api.confirmCompanyEmail).toHaveBeenCalledWith(
      created.email,
      "123456",
    );
  });

  it.each([
    ["company_cnpj_conflict", "cnpj", "CNPJ *", /Já existe uma empresa/],
    [
      "company_email_conflict",
      "corporate_email",
      "E-mail corporativo *",
      /Esse e-mail já está cadastrado/,
    ],
    [
      "company_segment_blocked",
      "cnpj",
      "CNPJ *",
      /ramo de atividade dessa empresa/,
    ],
    [
      "validation_error",
      "body.address.number",
      "Número *",
      /Confira o valor deste campo/,
    ],
  ])(
    "maps %s to its field and keeps input",
    async (code, field, label, message) => {
      vi.mocked(api.registerCompany).mockRejectedValue(
        new ApiError({
          message: "Synthetic error",
          code,
          errors: { [field]: ["Synthetic error"] },
        }),
      );
      mount();
      await fillValidForm();
      await submit();
      await waitFor(() =>
        expect(screen.getByLabelText(label)).toHaveAttribute(
          "aria-invalid",
          "true",
        ),
      );
      expect(screen.getAllByText(message).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Nome da empresa *")).toHaveValue(
        "Synthetic Company",
      );
      expect(screen.getByLabelText(label)).toHaveFocus();
      expect(screen.getByRole("button", { name: "Criar conta" })).toBeEnabled();
    },
  );

  it("rejects invalid CNPJ and mismatched passwords before submission", async () => {
    mount();
    await fillValidForm();
    fill("CNPJ *", "00000000000000");
    fill("Confirmar senha *", "AnotherPass!2026");
    await submit();
    expect(
      await screen.findByText("Informe um CNPJ válido."),
    ).toBeInTheDocument();
    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(api.registerCompany).not.toHaveBeenCalled();
    expect(api.getCompanyRecord).not.toHaveBeenCalledWith(
      "00000000000000",
      expect.anything(),
    );
  });

  it("does not allow an unknown CEP and permits retry", async () => {
    vi.mocked(api.getPostalAddress).mockRejectedValueOnce(
      new ApiError({
        message: "CEP não encontrado",
        code: "postal_code_not_found",
      }),
    );
    mount();
    fill("CEP *", "12345678");
    expect(await screen.findByText("CEP não encontrado")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Consultar CEP novamente" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Cidade *")).toHaveValue("Synthetic City"),
    );
    expect(api.registerCompany).not.toHaveBeenCalled();
  });

  it("reports registry failure and permits retry", async () => {
    vi.mocked(api.getCompanyRecord).mockRejectedValueOnce(
      new ApiError({
        message: "Unavailable",
        code: "cnpj_provider_unavailable",
      }),
    );
    mount();
    fill("CNPJ *", "11222333000181");
    expect(
      await screen.findByText(/consulta de CNPJ está indisponível/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Consultar CNPJ novamente" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Razão social")).toHaveValue(
        "Synthetic Registry SA",
      ),
    );
  });

  it("disables the form while saving and ignores a double click", async () => {
    let complete!: (value: api.CompanyRegistration) => void;
    vi.mocked(api.registerCompany).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    mount();
    await fillValidForm();
    await userEvent.dblClick(
      screen.getByRole("button", { name: "Criar conta" }),
    );
    expect(
      screen.getByRole("button", { name: "Criando conta…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("CNPJ *")).toBeDisabled();
    expect(api.registerCompany).toHaveBeenCalledTimes(1);
    complete(created);
    expect(await screen.findByText("Cadastro recebido")).toBeInTheDocument();
  });

  it("keeps data after an outage and supports confirmation before retry", async () => {
    vi.mocked(api.registerCompany).mockRejectedValueOnce(
      new ApiError({
        message: "Unavailable",
        code: "identity_provider_unavailable",
      }),
    );
    mount();
    await fillValidForm();
    await submit();
    await userEvent.click(
      await screen.findByRole("button", { name: /Recebi um código/ }),
    );
    fill("Código de confirmação", "123456");
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar e-mail" }),
    );
    expect(
      await screen.findByText(/E-mail confirmado. Confira seus dados/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome da empresa *")).toHaveFocus();
    expect(screen.getByLabelText("Nome da empresa *")).toHaveValue(
      "Synthetic Company",
    );
    await submit();
    expect(await screen.findByText("Cadastro recebido")).toBeInTheDocument();
  });

  it("offers confirmation immediately when Cognito requires it", async () => {
    vi.mocked(api.registerCompany).mockRejectedValue(
      new ApiError({
        message: "Confirm",
        code: "identity_confirmation_required",
      }),
    );
    mount();
    await fillValidForm();
    await submit();
    expect(
      await screen.findByLabelText("Código de confirmação"),
    ).toBeInTheDocument();
  });

  it("does not ask an already confirmed owner to confirm again", async () => {
    vi.mocked(api.registerCompany).mockResolvedValue({
      ...created,
      email_confirmation_required: false,
    });
    mount();
    await fillValidForm();
    await submit();
    expect(await screen.findByText("Cadastro recebido")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Código de confirmação"),
    ).not.toBeInTheDocument();
  });

  it("toggles both password fields with separate accessible controls", async () => {
    mount();
    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar senha" }),
    );
    expect(screen.getByLabelText("Senha *")).toHaveAttribute("type", "text");
    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar confirmação da senha" }),
    );
    expect(screen.getByLabelText("Confirmar senha *")).toHaveAttribute(
      "type",
      "text",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ocultar senha" }),
    );
    expect(screen.getByLabelText("Senha *")).toHaveAttribute(
      "type",
      "password",
    );
  });
});
