import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";

import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import { supportContactQueryKey } from "./support-contact";
import { SupportWhatsAppButton } from "./support-whatsapp-button";

const contact = {
  whatsapp_number: "5551999990000",
  initial_message: "Olá! Preciso de ajuda.",
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function renderButton() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SupportWhatsAppButton />
    </QueryClientProvider>,
  );
  return client;
}

async function settled(client: QueryClient) {
  await waitFor(() =>
    expect(client.isFetching({ queryKey: supportContactQueryKey })).toBe(0),
  );
}

describe("SupportWhatsAppButton", () => {
  it("opens the configured WhatsApp chat in a new tab", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": { status: 200, data: contact },
    });
    const client = renderButton();

    const link = await screen.findByRole("link", {
      name: /Suporte no WhatsApp/,
    });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.origin + url.pathname).toBe("https://wa.me/5551999990000");
    expect(url.searchParams.get("text")).toBe(contact.initial_message);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("Suporte no WhatsApp");
    await settled(client);
  });

  it("stays hidden when support is not configured", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": {
        status: 404,
        data: {
          title: "Not Found",
          status: 404,
          code: "support_contact_not_configured",
        },
      },
    });
    const client = renderButton();

    await settled(client);
    expect(
      screen.queryByRole("link", { name: /Suporte no WhatsApp/ }),
    ).not.toBeInTheDocument();
  });

  it("stays hidden when the contact cannot be loaded", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": { status: 0 },
    });
    const client = renderButton();

    await settled(client);
    expect(
      screen.queryByRole("link", { name: /Suporte no WhatsApp/ }),
    ).not.toBeInTheDocument();
  });
});
