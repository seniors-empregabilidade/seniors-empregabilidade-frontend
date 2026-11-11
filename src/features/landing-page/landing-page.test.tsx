import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  it("presents the platform's value proposition as the main heading", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /vinte anos de carreira/i,
      }),
    ).toBeVisible();
  });

  it("directs candidates to sign-up wherever the call to action appears", () => {
    render(<LandingPage />);

    const signupLinks = screen.getAllByRole("link", {
      name: "Criar minha conta",
    });
    expect(signupLinks.length).toBeGreaterThan(0);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/cadastro");
    }
  });

  it("directs companies to their own sign-up destination", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("link", { name: "Cadastrar minha empresa" }),
    ).toHaveAttribute("href", "/cadastro-empresa");
  });

  it("links 'Como funciona' to the how-it-works section", () => {
    render(<LandingPage />);

    const links = screen.getAllByRole("link", { name: "Como funciona" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "#como-funciona");
    }

    expect(document.getElementById("como-funciona")).toBeInTheDocument();
  });

  it("explains why to choose the platform with three supporting reasons", () => {
    render(<LandingPage />);

    const section = screen
      .getByRole("heading", { name: "Por que escolher a Seniors" })
      .closest("section");
    expect(section).not.toBeNull();

    expect(
      within(section as HTMLElement).getByRole("heading", {
        name: "Vaga que diz o que faltou",
      }),
    ).toBeVisible();
    expect(
      within(section as HTMLElement).getByRole("heading", {
        name: "Empresa identificada",
      }),
    ).toBeVisible();
    expect(
      within(section as HTMLElement).getByRole("heading", {
        name: "Cursos por habilidade",
      }),
    ).toBeVisible();
  });

  it("lists the trust signals below the hero", () => {
    render(<LandingPage />);

    expect(screen.getByText("Gratuita para candidatos")).toBeVisible();
    expect(screen.getByText("Empresas identificadas por CNPJ")).toBeVisible();
    expect(screen.getByText("Empresas não veem sua idade")).toBeVisible();
  });

  it("shows only working footer links and no placeholder items", () => {
    render(<LandingPage />);

    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByRole("link", { name: "Criar conta" }),
    ).toHaveAttribute("href", "/cadastro");
    expect(
      within(footer).getByRole("link", { name: "Cadastrar empresa" }),
    ).toHaveAttribute("href", "/cadastro-empresa");
    expect(within(footer).queryByText("Termos de uso")).toBeNull();
    expect(within(footer).queryByText(/AGES/)).toBeNull();
  });
});
