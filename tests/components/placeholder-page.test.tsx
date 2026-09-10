import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlaceholderPage } from "@/placeholder-page";

describe("PlaceholderPage", () => {
  it("shows the given context and a way back to the home page", () => {
    render(
      <PlaceholderPage
        eyebrow="Cadastro de profissional"
        description="Em breve você vai poder criar sua conta por aqui."
      />,
    );

    expect(screen.getByText("Cadastro de profissional")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Essa etapa ainda está em construção.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Em breve você vai poder criar sua conta por aqui."),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Voltar para a página inicial" }),
    ).toHaveAttribute("href", "/");
  });
});
