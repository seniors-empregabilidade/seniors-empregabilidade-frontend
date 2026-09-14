import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "@/lib/query-client";
import { clearSession, writeAccessToken } from "@/lib/session-storage";

import { Sidebar } from "./sidebar";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    navigate: navigateMock,
  }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    navigateMock.mockClear();
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

  it("shows the candidate nav items as static text, not as controls", () => {
    render(<Sidebar userType="candidate" />);

    [
      "Relatórios",
      "Vagas",
      "Candidaturas",
      "Capacitação",
      "Como usar",
      "Meu perfil",
    ].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
      expect(
        screen.queryByRole("button", { name: label }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: label }),
      ).not.toBeInTheDocument();
    });
    // None of these labels has a page behind it yet, so none may claim to be
    // the current page.
    expect(screen.queryByText("Relatórios")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows the company nav items", () => {
    render(<Sidebar userType="company" />);

    ["Relatórios", "Minhas vagas", "Perfil"].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
    });
  });

  it("shows the administrator nav items", () => {
    render(<Sidebar userType="administrator" />);

    ["Relatórios", "Empresas", "Candidatos", "Capacitação"].forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
    });
  });

  it("signs out and navigates back to login", async () => {
    const user = userEvent.setup();
    writeAccessToken("synthetic-token");

    render(<Sidebar userType="candidate" />);

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(navigateMock).toHaveBeenCalledWith({ href: "/login" });
  });
});
