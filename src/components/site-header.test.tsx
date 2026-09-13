import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    hash,
    children,
    ...props
  }: {
    to: string;
    hash?: string;
    children: React.ReactNode;
  }) => (
    <a href={hash ? `${to}#${hash}` : to} {...props}>
      {children}
    </a>
  ),
}));

import { SiteHeader } from "./site-header";

it.each(["app", "landing"] as const)(
  "takes the brand back to the landing page (%s)",
  (variant) => {
    render(<SiteHeader variant={variant} />);
    expect(screen.getByRole("link", { name: /Seniors/ })).toHaveAttribute(
      "href",
      "/",
    );
  },
);

it.each([
  ["Entrar", "/login"],
  ["Criar conta", "/cadastro"],
  ["Como funciona", "/#como-funciona"],
])("the landing header sends %s to %s", (name, href) => {
  render(<SiteHeader variant="landing" />);
  expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
});

it.each([
  ["Página inicial", "/"],
  ["Entrar", "/login"],
])("the app header sends %s to %s", (name, href) => {
  render(<SiteHeader variant="app" />);
  expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
});

it("keeps the sign-up call to action out of the app header", () => {
  render(<SiteHeader variant="app" />);
  expect(
    screen.queryByRole("link", { name: "Criar conta" }),
  ).not.toBeInTheDocument();
});

it("keeps the marketing items without a destination off the app header", () => {
  render(<SiteHeader variant="app" />);
  for (const item of ["Vagas", "Empresas", "Capacitação"]) {
    expect(screen.queryByText(item)).not.toBeInTheDocument();
  }
});

it.each(["app", "landing"] as const)(
  "names the navigation for assistive technology (%s)",
  (variant) => {
    render(<SiteHeader variant={variant} />);
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeVisible();
  },
);
