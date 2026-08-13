import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HomePage } from "@/home-page";

describe("HomePage", () => {
  it("shows and hides the technical details", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Seniors – Empregabilidade" }),
    ).toBeVisible();
    const details = screen
      .getByText("React, TypeScript e Vite")
      .closest("section");

    expect(details).not.toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Ver detalhes técnicos" }),
    );

    expect(details).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Ocultar detalhes técnicos" }),
    );

    expect(details).not.toBeVisible();
  });
});
