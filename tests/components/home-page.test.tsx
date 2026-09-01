import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePage } from "@/home-page";

describe("HomePage", () => {
  it("presents the platform's value proposition as the main heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /vinte anos de carreira/i,
      }),
    ).toBeVisible();
  });

  it("offers primary calls to action for candidates and companies", () => {
    render(<HomePage />);

    expect(
      screen.getAllByRole("button", { name: "Criar minha conta" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Cadastrar minha empresa" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });

  it("links 'Como funciona' to the how-it-works section", () => {
    render(<HomePage />);

    const links = screen.getAllByRole("link", { name: "Como funciona" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "#como-funciona");
    }

    expect(document.getElementById("como-funciona")).toBeInTheDocument();
  });

  it("explains why to choose the platform with three supporting reasons", () => {
    render(<HomePage />);

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
    render(<HomePage />);

    expect(screen.getByText("Gratuita para candidatos")).toBeVisible();
    expect(screen.getByText("Empresas identificadas por CNPJ")).toBeVisible();
    expect(screen.getByText("Sem filtro por idade")).toBeVisible();
  });

  it("shows the footer with candidate, company and institutional links", () => {
    render(<HomePage />);

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
