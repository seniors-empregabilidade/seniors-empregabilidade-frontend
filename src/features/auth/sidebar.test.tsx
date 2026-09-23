import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/lib/query-client";
import { clearSession, writeAccessToken } from "@/lib/session-storage";

import { Sidebar } from "./sidebar";

const navigateMock = vi.fn();
let pathname = "/candidato";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: navigateMock,
  }),
  useLocation: () => ({ pathname }),
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

describe("Sidebar", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    pathname = "/candidato";
  });

  afterEach(() => {
    clearSession();
    queryClient.clear();
  });

  it("shows the candidate area label", () => {
    render(<Sidebar userType="candidate" />);

    expect(screen.getByText("Seniors")).toBeVisible();
    expect(screen.getByText("Área do candidato")).toBeVisible();
  });

  it("shows the company area label", () => {
    render(<Sidebar userType="company" />);

    expect(screen.getByText("Área da empresa")).toBeVisible();
  });

  it("shows the administrator area label", () => {
    render(<Sidebar userType="administrator" />);

    expect(screen.getByText("Administração")).toBeVisible();
  });

  it("links Relatórios and Meu perfil to their real pages", () => {
    render(<Sidebar userType="candidate" />);

    expect(screen.getByRole("link", { name: "Relatórios" })).toHaveAttribute(
      "href",
      "/candidato",
    );
    expect(screen.getByRole("link", { name: "Meu perfil" })).toHaveAttribute(
      "href",
      "/candidato/perfil",
    );
  });

  it("marks the current page with aria-current", () => {
    pathname = "/candidato/perfil";
    render(<Sidebar userType="candidate" />);

    expect(screen.getByRole("link", { name: "Meu perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Relatórios" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("shows the remaining candidate nav items as static text, not as controls", () => {
    render(<Sidebar userType="candidate" />);

    ["Vagas", "Candidaturas", "Capacitação", "Como usar"].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
      expect(
        screen.queryByRole("button", { name: label }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: label }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows the company nav items as static text", () => {
    render(<Sidebar userType="company" />);

    ["Relatórios", "Minhas vagas", "Perfil"].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
      expect(
        screen.queryByRole("link", { name: label }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows the administrator nav items as static text", () => {
    render(<Sidebar userType="administrator" />);

    ["Relatórios", "Empresas", "Candidatos", "Capacitação"].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
      expect(
        screen.queryByRole("link", { name: label }),
      ).not.toBeInTheDocument();
    });
  });

  it("signs out, clears the query cache and navigates back to login", async () => {
    const user = userEvent.setup();
    writeAccessToken("synthetic-token");
    const clearSpy = vi.spyOn(queryClient, "clear");

    render(<Sidebar userType="candidate" />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(clearSpy).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith({ href: "/login" });
  });
});
