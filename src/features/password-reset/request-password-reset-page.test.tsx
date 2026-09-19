import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { stubApi, type ApiStub } from "../../../tests/api-stub";
import { RequestPasswordResetPage } from "./request-password-reset-page";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate }),
}));

let stub: ApiStub | null = null;

afterEach(() => {
  stub?.restore();
  stub = null;
  navigate.mockReset();
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RequestPasswordResetPage />
    </QueryClientProvider>,
  );
}

describe("RequestPasswordResetPage", () => {
  it("sends the address to the API and confirms without claiming it exists", async () => {
    stub = stubApi(202, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("E-mail"),
      "candidato@exemplo.invalid",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await screen.findByRole("dialog");

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]).toMatchObject({
      url: "/password-reset/send",
      method: "post",
      body: { email: "candidato@exemplo.invalid" },
    });
    expect(
      screen.getByText(/Se houver uma conta com esse e-mail/),
    ).toBeInTheDocument();
  });

  it("carries the address to the reset screen", async () => {
    stub = stubApi(202, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("E-mail"),
      "candidato@exemplo.invalid",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await user.click(
      await screen.findByRole("button", { name: "Inserir código" }),
    );

    expect(navigate).toHaveBeenCalledWith({
      href: "/reset-password?email=candidato%40exemplo.invalid",
    });
  });

  it("refuses an invalid address before calling the API", async () => {
    stub = stubApi(202, "");
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-mail"), "sem-arroba");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await screen.findByText("Informe um e-mail válido."),
    ).toBeInTheDocument();
    expect(stub.requests).toHaveLength(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports throttling in Brazilian Portuguese without the provider text", async () => {
    stub = stubApi(429, {
      title: "Too Many Requests",
      status: 429,
      detail: "Too many attempts. Try again later.",
      code: "too_many_attempts",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("E-mail"),
      "candidato@exemplo.invalid",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText(/Muitas tentativas/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Too many attempts/)).not.toBeInTheDocument();
  });

  it("reports an unavailable provider", async () => {
    stub = stubApi(503, {
      title: "Service Unavailable",
      status: 503,
      detail: "The identity provider is temporarily unavailable.",
      code: "identity_provider_unavailable",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("E-mail"),
      "candidato@exemplo.invalid",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Serviço temporariamente indisponível/),
      ).toBeInTheDocument();
    });
  });
});
