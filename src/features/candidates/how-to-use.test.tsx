import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HowToUsePage from "./how-to-use";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("HowToUsePage", () => {
  it("has one main heading and one heading per step plus the help section", () => {
    render(<HowToUsePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Como usar a plataforma" }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("links the shortcuts to the real candidate pages", () => {
    render(<HowToUsePage />);

    expect(
      screen.getByRole("link", { name: "Ir para Meu perfil" }),
    ).toHaveAttribute("href", "/candidato/perfil");
    expect(screen.getByRole("link", { name: "Ir para Vagas" })).toHaveAttribute(
      "href",
      "/candidato/vagas",
    );
    expect(
      screen.getByRole("link", { name: "Ir para Candidaturas" }),
    ).toHaveAttribute("href", "/candidato/candidaturas");
  });

  it("gives every illustration an accessible name", () => {
    render(<HowToUsePage />);

    expect(screen.getAllByRole("img")).toHaveLength(4);
    screen.getAllByRole("img").forEach((image) => {
      expect(image).toHaveAccessibleName(/^Ilustração da/);
    });
  });

  it("shows a screen capture that exists for every step", () => {
    const capturesInPublic = Object.keys(
      import.meta.glob("/public/images/como-usar/*.webp"),
    ).map((path) => path.replace("/public", ""));
    render(<HowToUsePage />);

    const images = screen.getAllByRole("img");
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      "/images/como-usar/meu-perfil.webp",
      "/images/como-usar/vagas.webp",
      "/images/como-usar/detalhe-da-vaga.webp",
      "/images/como-usar/candidaturas.webp",
    ]);
    images.forEach((image) => {
      expect(capturesInPublic).toContain(image.getAttribute("src"));
      expect(image).toHaveAttribute("width");
      expect(image).toHaveAttribute("height");
    });
  });

  it("points to support without promising hours or unconfirmed features", () => {
    render(<HowToUsePage />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Precisa de ajuda?" }),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent(/\d+h/);
    expect(document.body).not.toHaveTextContent(/e-mail|importa|sugest/i);
  });
});
