import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { type ApiStub, stubApiRoutes } from "../../../tests/api-stub";

import { companyStatusQueryOptions } from "./company-status";
import { CompanyStatusNotice } from "./company-status-notice";

const id = "60000000-0000-4000-8000-000000000010";
let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function renderWith(status: string, rejection_reason: string | null = null) {
  stub = stubApiRoutes({
    "GET /companies/me": {
      status: 200,
      data: { id, status, rejection_reason },
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CompanyStatusNotice />
    </QueryClientProvider>,
  );
  return client;
}

describe("CompanyStatusNotice", () => {
  it("tells a rejected company why and where to get help", async () => {
    renderWith("rejected", "CNPJ sintético inativo.");

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Seu cadastro não foi aprovado.");
    expect(notice).toHaveTextContent("Motivo: CNPJ sintético inativo.");
    expect(notice).toHaveTextContent("fale com o suporte");
    expect(notice).not.toHaveTextContent("ainda não foi aprovada");
  });

  it("tells a pending company that approval is still due", async () => {
    renderWith("pending");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sua empresa ainda não foi aprovada.",
    );
  });

  it("shows nothing to an approved company", async () => {
    const client = renderWith("approved");

    await waitFor(() =>
      expect(
        client.getQueryState(companyStatusQueryOptions.queryKey)?.status,
      ).toBe("success"),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
