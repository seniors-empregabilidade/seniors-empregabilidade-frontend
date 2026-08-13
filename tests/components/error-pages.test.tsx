import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApplicationErrorPage, NotFoundPage } from "@/error-pages";

describe("ApplicationErrorPage", () => {
  it("shows a safe error state and retries", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ApplicationErrorPage onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar esta página.",
      }),
    ).toBeVisible();
    expect(screen.queryByRole("code")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows technical details when they are explicitly provided", () => {
    render(
      <ApplicationErrorPage
        errorMessage="Development detail"
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Development detail")).toBeVisible();
  });
});

describe("NotFoundPage", () => {
  it("links back to the home page", () => {
    render(<NotFoundPage />);

    expect(
      screen.getByRole("link", { name: "Voltar ao início" }),
    ).toHaveAttribute("href", "/");
  });
});
