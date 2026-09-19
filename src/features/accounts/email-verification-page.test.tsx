import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import {
  PENDING_EMAIL_KEY,
  readPendingEmail,
  writePendingEmail,
} from "@/lib/pending-email";
import { EmailVerificationPage } from "./email-verification-page";

const email = "pessoa@example.com";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  window.sessionStorage.clear();
});
function setup(pendingEmail?: string) {
  if (pendingEmail) writePendingEmail(pendingEmail);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <EmailVerificationPage />
    </QueryClientProvider>,
  );
  return { ...view, user: userEvent.setup() };
}
async function sendFromFirstStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByLabelText("Código de verificação");
}

describe("EmailVerificationPage", () => {
  it("starts with only email, sends the code and shows a masked pending address", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 202, data: "" });
    const { user } = setup();
    expect(
      screen.queryByLabelText("Código de verificação"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reenviar código" }),
    ).not.toBeInTheDocument();
    await sendFromFirstStep(user);
    expect(post.mock.calls[0]?.slice(0, 2)).toEqual([
      "/email-verification/send",
      { email },
    ]);
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.getByText("p***@e***.com")).toBeVisible();
    expect(screen.queryByText(email)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Se este e-mail estiver cadastrado",
    );
    expect(readPendingEmail()?.email).toBe(email);
    expect(
      screen.getByRole("heading", { name: "Informe o código de verificação" }),
    ).toHaveFocus();
    expect(
      screen.queryByText("Use o código do e-mail mais recente."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Você pode colar/)).not.toBeInTheDocument();
  });

  it("skips email entry when registration provided a pending context", () => {
    const post = vi.spyOn(apiClient, "post");
    setup(email);
    expect(screen.getByLabelText("Código de verificação")).toHaveAttribute(
      "autocomplete",
      "one-time-code",
    );
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("clears context and entered code when changing email", async () => {
    const { user } = setup(email);
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    expect(window.sessionStorage.getItem(PENDING_EMAIL_KEY)).not.toContain(
      "123456",
    );
    await user.click(screen.getByRole("button", { name: "Alterar e-mail" }));
    expect(readPendingEmail()).toBeNull();
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
    expect(
      screen.queryByLabelText("Código de verificação"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Verifique seu e-mail" }),
    ).toHaveFocus();
  });

  it("confirms using the full pending email and clears storage on success", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValueOnce({ status: 204, data: "" });
    const { user } = setup(email);
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.click(screen.getByRole("button", { name: "Confirmar e-mail" }));
    expect(
      await screen.findByRole("heading", { name: "E-mail verificado" }),
    ).toHaveFocus();
    expect(post.mock.calls[0]?.slice(0, 2)).toEqual([
      "/email-verification/confirm",
      { email, code: "123456" },
    ]);
    expect(readPendingEmail()).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ir para o login" }),
    ).toHaveAttribute("href", "/login");
  });

  it.each([false, true])(
    "validates the active step locally (pending=%s)",
    async (pending) => {
      const post = vi.spyOn(apiClient, "post");
      const { user } = setup(pending ? email : undefined);
      await user.click(
        screen.getByRole("button", {
          name: pending ? "Confirmar e-mail" : "Enviar código",
        }),
      );
      const input = screen.getByLabelText(
        pending ? "Código de verificação" : "E-mail",
      );
      await waitFor(() => expect(input).toHaveFocus());
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(
        pending
          ? "Informe o código recebido por e-mail."
          : "Informe seu e-mail.",
      );
      expect(post).not.toHaveBeenCalled();
    },
  );

  it.each(["invalid_verification_code", "validation_error"])(
    "associates %s with body.code without technical text",
    async (code) => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError({
          message: "PRIVATE",
          code,
          errors: { "body.code": ["PRIVATE"] },
        }),
      );
      const { user } = setup(email);
      await user.type(screen.getByLabelText("Código de verificação"), "123456");
      await user.click(
        screen.getByRole("button", { name: "Confirmar e-mail" }),
      );
      await waitFor(() =>
        expect(screen.getByLabelText("Código de verificação")).toHaveFocus(),
      );
      expect(screen.getByLabelText("Código de verificação")).toHaveAttribute(
        "aria-describedby",
        "verification-code-error",
      );
      expect(screen.queryByText("PRIVATE")).not.toBeInTheDocument();
    },
  );

  it.each(["email", "body.email"])(
    "returns to email entry to correct %s",
    async (field) => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError({
          message: "PRIVATE",
          code: "validation_error",
          errors: { [field]: ["PRIVATE"], "body.unknown": ["PRIVATE"] },
        }),
      );
      const { user } = setup(email);
      await user.type(screen.getByLabelText("Código de verificação"), "123456");
      await user.click(
        screen.getByRole("button", { name: "Confirmar e-mail" }),
      );
      expect(await screen.findByLabelText("E-mail")).toHaveValue(email);
      await waitFor(() =>
        expect(screen.getByLabelText("E-mail")).toHaveFocus(),
      );
      expect(screen.getByLabelText("E-mail")).toHaveAttribute(
        "aria-describedby",
        "verification-email-error",
      );
      expect(readPendingEmail()).toBeNull();
      expect(screen.queryByText("PRIVATE")).not.toBeInTheDocument();
    },
  );

  it.each([
    "too_many_attempts",
    "identity_provider_unavailable",
    "validation_error",
    "unknown",
  ])("focuses a summary for %s and keeps the first step", async (code) => {
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiError({ message: "PRIVATE", code }),
    );
    const { user } = setup();
    await user.type(screen.getByLabelText("E-mail"), email);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(screen.getByLabelText("E-mail")).toHaveValue(email);
    expect(screen.queryByText("PRIVATE")).not.toBeInTheDocument();
    expect(readPendingEmail()).toBeNull();
  });

  it("continues in memory when sessionStorage is blocked", async () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(apiClient, "post")
      .mockResolvedValueOnce({ status: 202, data: "" })
      .mockResolvedValueOnce({ status: 204, data: "" });
    const { user } = setup();
    await sendFromFirstStep(user);
    await user.type(screen.getByLabelText("Código de verificação"), "123456");
    await user.click(screen.getByRole("button", { name: "Confirmar e-mail" }));
    expect(
      await screen.findByRole("heading", { name: "E-mail verificado" }),
    ).toBeVisible();
  });

  it("ignores a malformed pending email", () => {
    writePendingEmail("invalid");
    setup();
    expect(screen.getByLabelText("E-mail")).toBeVisible();
  });

  it("keeps the countdown consultable, survives reload and removes it at zero", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ status: 202, data: "" });
    const { user, unmount } = setup();
    await sendFromFirstStep(user);
    const help =
      "Não recebeu o código? Confira o e-mail informado e a pasta de spam.";
    const button = screen.getByRole("button", { name: "Reenviar código" });
    const counter = screen.getByText(
      "Você pode solicitar outro código em 60 segundos.",
    );
    expect(button).toHaveAccessibleDescription(
      `${help} Você pode solicitar outro código em 60 segundos.`,
    );
    expect(
      counter.closest('[aria-live], [role="status"], [role="alert"]'),
    ).toBeNull();
    expect(counter).not.toHaveAttribute("aria-hidden");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(counter).toHaveTextContent(
      "Você pode solicitar outro código em 59 segundos.",
    );
    unmount();
    const reloaded = setup();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(
      screen.getByText("Você pode solicitar outro código em 59 segundos."),
    ).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(58_000);
    });
    expect(
      screen.getByRole("button", { name: "Reenviar código" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Você pode solicitar outro código em 1 segundo."),
    ).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.queryByText(/Você pode solicitar outro código em/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Você já pode pedir outro código/),
    ).not.toBeInTheDocument();
    const enabled = screen.getByRole("button", { name: "Reenviar código" });
    expect(enabled).toBeEnabled();
    expect(enabled).toHaveAccessibleDescription(help);
    await reloaded.user.click(enabled);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(
        "Você pode solicitar outro código em 60 segundos.",
      ),
    ).toBeVisible();
  });

  it.each(["confirm", "change", "unmount"])(
    "clears the resend interval on %s",
    async (action) => {
      const start = vi.spyOn(window, "setInterval");
      const clear = vi.spyOn(window, "clearInterval");
      vi.spyOn(apiClient, "post").mockResolvedValue({ status: 202, data: "" });
      const { user, unmount } = setup();
      await sendFromFirstStep(user);
      const index = start.mock.calls.findIndex(([, delay]) => delay === 1000);
      const id: unknown = start.mock.results[index]?.value;
      expect(index).toBeGreaterThanOrEqual(0);
      expect(clear.mock.calls.some(([value]) => value === id)).toBe(false);
      if (action === "confirm") {
        await user.type(
          screen.getByLabelText("Código de verificação"),
          "123456",
        );
        await user.click(
          screen.getByRole("button", { name: "Confirmar e-mail" }),
        );
        await screen.findByRole("heading", { name: "E-mail verificado" });
      } else if (action === "change")
        await user.click(
          screen.getByRole("button", { name: "Alterar e-mail" }),
        );
      else unmount();
      await waitFor(() =>
        expect(clear.mock.calls.some(([value]) => value === id)).toBe(true),
      );
    },
  );

  it("keeps the code step after a resend failure without starting a countdown", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("PRIVATE"));
    const { user } = setup(email);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(
      screen.getByRole("button", { name: "Reenviar código" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/Você pode solicitar outro código em/),
    ).not.toBeInTheDocument();
  });

  it("blocks duplicate sends and aborts on unmount", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockImplementation(() => new Promise(() => {}));
    const { user, unmount } = setup();
    await user.type(screen.getByLabelText("E-mail"), email);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    const button = screen.getByRole("button", { name: "Enviando código..." });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(post).toHaveBeenCalledTimes(1);
    const signal = post.mock.calls[0]?.[2]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
