import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import { NotificationsButton } from "./notifications-button";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function renderButton() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationsButton to="/candidato/notificacoes" />
    </QueryClientProvider>,
  );
}

function stubUnreadCount(count: number) {
  stub = stubApiRoutes({
    "GET /notifications/me": {
      status: 200,
      data: { items: [], unread_count: count, next_cursor: null },
    },
  });
}

describe("NotificationsButton", () => {
  it("links to the notification center and announces the unread count", async () => {
    stubUnreadCount(3);
    renderButton();

    const link = await screen.findByRole("link", {
      name: "Notificações, 3 não lidas",
    });
    expect(link).toHaveAttribute("href", "/candidato/notificacoes");
    expect(link).toHaveTextContent("3");
  });

  it("uses the singular for one unread notification", async () => {
    stubUnreadCount(1);
    renderButton();

    expect(
      await screen.findByRole("link", { name: "Notificações, 1 não lida" }),
    ).toBeVisible();
  });

  it("caps the visible counter at 99+", async () => {
    stubUnreadCount(150);
    renderButton();

    expect(
      await screen.findByRole("link", { name: "Notificações, 150 não lidas" }),
    ).toHaveTextContent("99+");
  });

  it("shows no counter when everything is read", async () => {
    stubUnreadCount(0);
    renderButton();

    const link = screen.getByRole("link", { name: "Notificações" });
    await vi.waitFor(() => expect(stub?.requests).toHaveLength(1));
    expect(link).toHaveTextContent(/^Notificações$/);
  });

  it("still opens the center when the counter cannot be loaded", async () => {
    stub = stubApiRoutes({ "GET /notifications/me": { status: 0 } });
    renderButton();

    await vi.waitFor(() => expect(stub?.requests).toHaveLength(1));
    expect(screen.getByRole("link", { name: "Notificações" })).toHaveAttribute(
      "href",
      "/candidato/notificacoes",
    );
  });
});
