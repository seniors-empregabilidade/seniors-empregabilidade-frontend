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

    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/cadastro",
    );
  });

  it("directs companies to their own sign-up destination", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("link", { name: "Cadastrar minha empresa" }),
    ).toHaveAttribute("href", "/cadastro-empresa");
  });

  it("directs returning visitors to the login destination", () => {
    render(<LandingPage />);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login",
    );
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
        name: "Capacitação ligada à vaga",
      }),
    ).toBeVisible();
  });

  it("lists the trust signals below the hero", () => {
    render(<LandingPage />);

    expect(screen.getByText("Gratuita para candidatos")).toBeVisible();
    expect(screen.getByText("Empresas identificadas por CNPJ")).toBeVisible();
    expect(screen.getByText("Sem filtro por idade")).toBeVisible();
  });

  it("shows the footer with candidate, company and institutional links", () => {
    render(<LandingPage />);

    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByText("Para candidatos", { exact: false }),
    ).toBeVisible();
    expect(
      within(footer).getByText("Para empresas", { exact: false }),
    ).toBeVisible();
    expect(within(footer).getByText("Buscar vagas")).toBeVisible();
    expect(within(footer).getByText("Cadastrar empresa")).toBeVisible();
    expect(within(footer).getByText("Sobre nós")).toBeVisible();
  });
});
