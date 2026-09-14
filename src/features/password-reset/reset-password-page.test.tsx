import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { stubApi, type ApiStub } from "../../../tests/api-stub";
import { ResetPasswordPage } from "./reset-password-page";

const EMAIL = "candidato@exemplo.invalid";
const NEW_PASSWORD = "NovaSenha!42";

let stub: ApiStub | null = null;

afterEach(() => {
  stub?.restore();
  stub = null;
});

function renderPage(email = EMAIL) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ResetPasswordPage email={email} />
    </QueryClientProvider>,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Código de verificação"), "123456");
  await user.type(screen.getByLabelText("Nova senha"), NEW_PASSWORD);
  await user.type(screen.getByLabelText("Confirmar nova senha"), NEW_PASSWORD);
  await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
}

describe("ResetPasswordPage", () => {
  it("prefills the address carried from the request screen", () => {
    renderPage();

    expect(screen.getByLabelText("E-mail")).toHaveValue(EMAIL);
  });

  it("sends the address, the code and the new password", async () => {
    stub = stubApi(204, "");
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(await screen.findByText("Senha redefinida!")).toBeInTheDocument();
    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]).toMatchObject({
      url: "/password-reset/confirm",
      method: "post",
      body: { email: EMAIL, code: "123456", password: NEW_PASSWORD },
    });
  });

  it("never sends the confirmation field to the API", async () => {
    stub = stubApi(204, "");
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);
    await screen.findByText("Senha redefinida!");

    expect(stub.requests[0]?.body).not.toHaveProperty("confirmPassword");
  });

  it("shows the expired-code screen when the API rejects the code", async () => {
    stub = stubApi(422, {
      title: "Validation Error",
      status: 422,
      detail: "The verification code is invalid or expired.",
      code: "invalid_verification_code",
      errors: { code: ["The verification code is invalid or expired."] },
    });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(
      await screen.findByText("Código inválido ou expirado"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Solicitar novo código" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("reports a password the pool refuses on the password field", async () => {
    stub = stubApi(422, {
      title: "Validation Error",
      status: 422,
      detail: "The password does not meet the identity provider policy.",
      code: "password_policy_violation",
      errors: { password: ["The password does not meet the required policy."] },
    });
    const user = userEvent.setup();
    renderPage();

    await fillAndSubmit(user);

    expect(
      await screen.findByText(
        "A senha não atende aos requisitos de segurança.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Senha redefinida!")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/identity provider policy/),
    ).not.toBeInTheDocument();
  });

  it("refuses a mismatched confirmation before calling the API", async () => {
    stub = stubApi(204, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.type(screen.getByLabelText("Nova senha"), NEW_PASSWORD);
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "OutraSenha!42",
    );
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(
      await screen.findByText("As senhas não coincidem."),
    ).toBeInTheDocument();
    expect(stub.requests).toHaveLength(0);
  });

  it("refuses a password that fails the pool rules before calling the API", async () => {
    stub = stubApi(204, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.type(screen.getByLabelText("Nova senha"), "fraca");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "fraca");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(
      await screen.findByText("A senha não atende aos requisitos abaixo."),
    ).toBeInTheDocument();
    expect(stub.requests).toHaveLength(0);
  });

  it("refuses an empty code before calling the API", async () => {
    stub = stubApi(204, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Nova senha"), NEW_PASSWORD);
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      NEW_PASSWORD,
    );
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(
      await screen.findByText("Informe o código recebido por e-mail."),
    ).toBeInTheDocument();
    expect(stub.requests).toHaveLength(0);
  });

  it("ticks the password rules as the user types", async () => {
    const user = userEvent.setup();
    renderPage();

    const rule = screen.getByText("Pelo menos 8 caracteres");
    expect(rule).toHaveClass("text-muted-foreground");

    await user.type(screen.getByLabelText("Nova senha"), NEW_PASSWORD);

    expect(screen.getByText("Pelo menos 8 caracteres")).toHaveClass(
      "text-green-600",
    );
  });
});
