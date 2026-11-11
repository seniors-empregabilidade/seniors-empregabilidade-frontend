import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cleanup,
  render as renderComponent,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import { CourseSearchView } from "./course-search-view";
import type { Course, CourseSearchPage } from "./trainings-api";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}));

const course: Course = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "NR-11: movimentação de cargas",
  institution: "SENAI",
  mode: "onsite",
  external_link: "  https://example.com/nr-11  ",
  skills: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Operação de empilhadeira",
      type: "hard",
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Segurança do trabalho",
      type: "hard",
    },
  ],
};

const incompleteCourse: Course = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Liderança de equipes operacionais",
  institution: null,
  mode: null,
  external_link: "javascript:alert(1)",
  skills: [],
};

function page(items: Course[], total = items.length): CourseSearchPage {
  return { items, total };
}

function render(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderComponent(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("CourseSearchView", () => {
  it("shows a course card and opens only a parsed external link", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: page([course, incompleteCourse]),
    });

    render(<CourseSearchView />);

    expect(
      await screen.findByRole("heading", {
        name: "NR-11: movimentação de cargas",
      }),
    ).toBeVisible();
    expect(screen.getByText("SENAI · Presencial")).toBeVisible();
    expect(
      screen.getByText((_, element) => {
        return (
          element?.tagName === "P" &&
          element.textContent ===
            "Habilidades: Operação de empilhadeira, Segurança do trabalho"
        );
      }),
    ).toBeVisible();
    // Without skills, the second card shows no empty line.
    expect(screen.getAllByText(/^Habilidades:/)).toHaveLength(1);
    expect(
      screen.getByText("O link deste curso não está disponível."),
    ).toBeVisible();

    const link = screen.getByRole("link", {
      name: "Acessar curso NR-11: movimentação de cargas, abre em uma nova aba",
    });
    expect(link).toHaveAttribute("href", "https://example.com/nr-11");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(document.body.innerHTML).not.toContain("javascript:");
    expect(
      screen.getByRole("search", { name: "Buscar cursos por habilidade" }),
    ).toBeVisible();
  });

  it("shows the loading status until the list arrives", () => {
    vi.spyOn(apiClient, "get").mockReturnValue(new Promise(() => undefined));

    render(<CourseSearchView />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando cursos…");
  });

  it("shows an empty catalog and an empty filter result", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: page([]) });
    const user = userEvent.setup();

    render(<CourseSearchView />);

    expect(
      await screen.findByText("Nenhum curso disponível no momento."),
    ).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();

    await user.type(screen.getByLabelText("Buscar por habilidade"), "Excel");

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(
        "/trainings",
        expect.objectContaining({
          params: expect.objectContaining({ skill: "Excel" }) as unknown,
        }),
      ),
    );
    expect(
      await screen.findByText("Nenhum curso encontrado para “Excel”."),
    ).toBeVisible();
  });

  it("counts a single course in the singular", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: page([course]) });

    render(<CourseSearchView />);

    expect(
      await screen.findByText((_, element) => {
        return element?.textContent === "1 curso encontrado";
      }),
    ).toBeVisible();
  });

  it("counts every match and says when only the first page is shown", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: page([course, incompleteCourse], 35),
    });

    render(<CourseSearchView />);

    expect(
      await screen.findByText((_, element) => {
        return (
          element?.getAttribute("role") === "status" &&
          element.textContent ===
            "35 cursos encontrados. Mostrando os 2 primeiros."
        );
      }),
    ).toBeVisible();
  });

  it("shows an error state and retries the same search", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();

    render(<CourseSearchView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os cursos. Tente novamente.",
    );

    get.mockResolvedValueOnce({ data: page([course]) });
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByRole("heading", {
        name: "NR-11: movimentação de cargas",
      }),
    ).toBeVisible();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("waits until typing pauses before filtering", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: page([course]) });
    const user = userEvent.setup();

    render(<CourseSearchView />);
    await screen.findByRole("heading", {
      name: "NR-11: movimentação de cargas",
    });
    get.mockClear();

    await user.type(screen.getByLabelText("Buscar por habilidade"), "NR-11");

    expect(get).not.toHaveBeenCalled();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith(
      "/trainings",
      expect.objectContaining({
        params: expect.objectContaining({ skill: "NR-11" }) as unknown,
        signal: expect.any(AbortSignal) as unknown,
      }),
    );
  });

  it("limits the skill field to the search cap", () => {
    vi.spyOn(apiClient, "get").mockReturnValue(new Promise(() => undefined));

    render(<CourseSearchView />);

    expect(screen.getByLabelText("Buscar por habilidade")).toHaveAttribute(
      "maxLength",
      "100",
    );
  });
});
