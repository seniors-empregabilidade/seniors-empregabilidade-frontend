import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginPage } from "@/login-page";
import { ApiError } from "@/lib/api-error";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: navigateMock,
  }),
}));

vi.mock("@/lib/auth/login", () => ({
  login: vi.fn(),
}));

import { login } from "@/lib/auth/login";

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  it("keeps Entrar disabled until required fields are valid", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    const submitButton = screen.getByRole("button", { name: "Entrar" });

    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "usuario@exemplo.com",
    );
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("shows email format validation", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "email-invalido",
    );
    await user.tab();

    expect(screen.getByText("Informe um e-mail válido.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
  });

  it("places Esqueci minha senha below Entrar", () => {
    renderLoginPage();

    const submitButton = screen.getByRole("button", { name: "Entrar" });
    const forgotPassword = screen.getByRole("link", {
      name: "Esqueci minha senha",
    });

    expect(submitButton.compareDocumentPosition(forgotPassword)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("follows a logical tab order", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "usuario@exemplo.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    });

    await user.click(screen.getByLabelText("Usuário (e-mail)"));

    await user.tab();
    expect(screen.getByLabelText("Senha")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole("link", { name: "Esqueci minha senha" }),
    ).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Criar conta" })).toHaveFocus();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    const passwordInput = screen.getByLabelText("Senha");

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeVisible();
  });

  it("shows a generic error message when authentication fails", async () => {
    const user = userEvent.setup();

    vi.mocked(login).mockRejectedValueOnce(
      new ApiError({
        message: "Unauthorized",
        status: 401,
        code: "invalid_credentials",
      }),
    );

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "usuario@exemplo.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-incorreta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByRole("alert", {
        name: (_accessibleName, element) =>
          element.textContent === "E-mail ou senha incorretos",
      }),
    ).toBeVisible();
  });

  it("shows field errors from the API on the matching inputs", async () => {
    const user = userEvent.setup();

    vi.mocked(login).mockRejectedValueOnce(
      new ApiError({
        message: "Não foi possível concluir a comunicação com o servidor.",
        status: 422,
        errors: {
          email: ["E-mail inválido", "E-mail não encontrado"],
          password: ["Senha obrigatória"],
        },
      }),
    );

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "usuario@exemplo.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("E-mail inválido E-mail não encontrado"),
    ).toBeVisible();
    expect(screen.getByText("Senha obrigatória")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Usuário (e-mail)")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows loading state and redirects on success", async () => {
    const user = userEvent.setup();

    vi.mocked(login).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ role: "candidato" });
          }, 50);
        }),
    );

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Usuário (e-mail)"),
      "usuario@exemplo.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const loadingButton = screen.getByRole("button", { name: "Entrando..." });

    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute("aria-busy", "true");

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ href: "/candidato" });
    });
  });
});
