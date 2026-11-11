import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  stubApiRoutes,
  type ApiStub,
  type RecordedRequest,
  type StubRoute,
} from "../../../tests/api-stub";

import { TrainingsAdminPage } from "./trainings-admin-page";

const excel = {
  id: "64000000-0000-4000-8000-000000000001",
  name: "Excel",
  type: "hard",
};
const teamwork = {
  id: "64000000-0000-4000-8000-000000000002",
  name: "Trabalho em grupo",
  type: "soft",
};
const published = {
  id: "66000000-0000-4000-8000-000000000001",
  title: "Excel básico",
  institution: "Instituto Sintético",
  mode: "online",
  external_link: "https://example.invalid/excel",
  published: true,
  skills: [excel],
  job_ids: ["67000000-0000-4000-8000-000000000001"],
};
const unpublished = {
  id: "66000000-0000-4000-8000-000000000002",
  title: "Liderança prática",
  institution: "Escola Sintética",
  mode: "onsite",
  external_link: "javascript:alert(1)",
  published: false,
  skills: [],
  job_ids: [],
};
const firstPage = { items: [published, unpublished], total: 2 };
const publishedRoute = `PATCH /admin/trainings/${published.id}`;
const unpublishedRoute = `PATCH /admin/trainings/${unpublished.id}`;

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

/** Answers the course list with `list` and every other call through `routes`. */
function mount(
  routes: Record<string, StubRoute> = {},
  list: StubRoute = { status: 200, data: firstPage },
) {
  stub = stubApiRoutes(
    { "GET /skills": { status: 200, data: [excel, teamwork] }, ...routes },
    (request) =>
      request.url?.startsWith("/admin/trainings?")
        ? typeof list === "function"
          ? list(request)
          : list
        : { status: 404, data: { title: "Not Found", status: 404 } },
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <TrainingsAdminPage />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

function listRequests(): RecordedRequest[] {
  return (stub?.requests ?? []).filter(
    (request) => request.url?.startsWith("/admin/trainings?") === true,
  );
}

function row(title: string) {
  const header = screen.getByRole("rowheader", { name: new RegExp(title) });
  const tableRow = header.closest("tr");
  if (!(tableRow instanceof HTMLElement)) {
    throw new Error(`Missing row for ${title}`);
  }
  return within(tableRow);
}

async function shown(title: string) {
  return screen.findByRole("rowheader", { name: new RegExp(title) });
}

describe("TrainingsAdminPage", () => {
  it("lists the courses with mode, skills, jobs and status", async () => {
    mount();

    await shown("Excel básico");
    expect(
      screen.getByRole("heading", { level: 1, name: "Capacitação" }),
    ).toBeVisible();
    expect(row("Excel básico").getByText("Online")).toBeVisible();
    expect(row("Excel básico").getByText("Excel")).toBeVisible();
    expect(row("Excel básico").getByText("1")).toBeVisible();
    expect(row("Excel básico").getByText("Publicado")).toBeVisible();
    expect(row("Liderança prática").getByText("Inativo")).toBeVisible();
    expect(row("Liderança prática").getByText("Presencial")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Inativar Excel básico" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reativar Liderança prática" }),
    ).toBeVisible();
    expect(screen.getByText("1–2 de 2")).toBeVisible();
    expect(listRequests()[0]?.url).toBe("/admin/trainings?limit=20&offset=0");
  });

  it("opens only safe links in a new tab", async () => {
    mount();

    await shown("Excel básico");
    expect(
      row("Excel básico").getByRole("link", {
        name: "Abrir o link de Excel básico em nova aba",
      }),
    ).toHaveAttribute("href", "https://example.invalid/excel");
    expect(
      row("Liderança prática").queryByRole("link"),
    ).not.toBeInTheDocument();
  });

  it("filters by text and status and restarts from the first page", async () => {
    const user = mount({}, (request) => ({
      status: 200,
      data: request.url?.includes("published=false")
        ? { items: [unpublished], total: 1 }
        : firstPage,
    }));

    await shown("Excel básico");
    await user.selectOptions(screen.getByLabelText("Situação"), "unpublished");

    await waitFor(() =>
      expect(listRequests().at(-1)?.url).toBe(
        "/admin/trainings?published=false&limit=20&offset=0",
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("rowheader", { name: /Excel básico/ }),
      ).not.toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText("Buscar por nome ou instituição"),
      "lider",
    );
    await waitFor(() =>
      expect(listRequests().at(-1)?.url).toBe(
        "/admin/trainings?search=lider&published=false&limit=20&offset=0",
      ),
    );
  });

  it("pages through the list", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => ({
      ...published,
      id: "65000000-0000-4000-8000-" + String(index + 1).padStart(12, "0"),
      title: "Curso sintético " + (index + 1),
    }));
    const user = mount({}, (request) => ({
      status: 200,
      data: request.url?.includes("offset=20")
        ? { items: [unpublished], total: 21 }
        : { items: rows, total: 21 },
    }));

    await shown("^Curso sintético 1(?!\\d)");
    expect(screen.getByText("1–20 de 21")).toBeVisible();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await shown("Liderança prática");
    expect(screen.getByText("21–21 de 21")).toBeVisible();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await shown("^Curso sintético 1(?!\\d)");
  });

  it("explains an empty catalog and empty filters", async () => {
    mount({}, { status: 200, data: { items: [], total: 0 } });

    expect(
      await screen.findByText(
        "Ainda não há cursos cadastrados. Cadastre o primeiro.",
      ),
    ).toBeVisible();
  });

  it("explains a filter without results", async () => {
    const user = mount({}, (request) => ({
      status: 200,
      data: request.url?.includes("search=")
        ? { items: [], total: 0 }
        : firstPage,
    }));

    await shown("Excel básico");
    await user.type(
      screen.getByLabelText("Buscar por nome ou instituição"),
      "zzz",
    );

    expect(
      await screen.findByText("Nenhum curso encontrado com esses filtros."),
    ).toBeVisible();
  });

  it("offers a retry when the list fails and says when it is not an administrator", async () => {
    let calls = 0;
    const user = mount({}, () => {
      calls += 1;
      return calls === 1
        ? {
            status: 403,
            data: {
              title: "Forbidden",
              status: 403,
              code: "administrator_required",
            },
          }
        : { status: 200, data: firstPage };
    });

    expect(
      await screen.findByText(
        "Apenas administradores podem consultar os cursos.",
      ),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await shown("Excel básico");
  });

  it("creates a course with its skills, unpublished by default", async () => {
    const user = mount({
      "POST /admin/trainings": { status: 201, data: published },
    });

    await shown("Excel básico");
    await user.click(screen.getByRole("button", { name: "Novo curso" }));
    const dialog = await screen.findByRole("dialog", { name: "Novo curso" });
    const form = within(dialog);

    await user.click(form.getByRole("button", { name: "Cadastrar curso" }));
    expect(await form.findByText("Informe o nome do curso.")).toBeVisible();
    expect(form.getByText("Informe a instituição.")).toBeVisible();
    expect(form.getByText("Escolha a modalidade do curso.")).toBeVisible();
    expect(form.getByText("Informe o link do curso.")).toBeVisible();

    await user.type(form.getByLabelText("Nome do curso *"), "Excel básico");
    await user.type(
      form.getByLabelText("Instituição *"),
      "Instituto Sintético",
    );
    await user.click(form.getByRole("radio", { name: "Online" }));
    await user.type(
      form.getByLabelText("Link do curso *"),
      "https://example.invalid/excel",
    );
    await user.click(await form.findByRole("checkbox", { name: /Excel/ }));
    expect(form.getByText("1 competência relacionada.")).toBeVisible();
    await user.click(form.getByRole("button", { name: "Cadastrar curso" }));

    expect(
      await screen.findByText("Curso “Excel básico” cadastrado."),
    ).toBeVisible();
    const post = stub?.requests.find((request) => request.method === "post");
    expect(post?.body).toEqual({
      title: "Excel básico",
      institution: "Instituto Sintético",
      mode: "online",
      external_link: "https://example.invalid/excel",
      published: false,
      skill_ids: [excel.id],
    });
  });

  it("rejects an address that is not a web link", async () => {
    const user = mount();

    await shown("Excel básico");
    await user.click(screen.getByRole("button", { name: "Novo curso" }));
    const form = within(await screen.findByRole("dialog"));
    await user.type(form.getByLabelText("Link do curso *"), "exemplo.com.br");
    await user.click(form.getByRole("button", { name: "Cadastrar curso" }));

    expect(
      await form.findByText(
        "Informe um link completo, começando com http:// ou https://.",
      ),
    ).toBeVisible();
  });

  it("edits a course, adds and removes skills, and keeps its jobs", async () => {
    const user = mount({
      [publishedRoute]: {
        status: 200,
        data: { ...published, title: "Excel avançado" },
      },
    });

    await shown("Excel básico");
    await user.click(
      screen.getByRole("button", { name: "Editar Excel básico" }),
    );
    const form = within(
      await screen.findByRole("dialog", { name: "Editar curso" }),
    );

    expect(form.getByLabelText("Nome do curso *")).toHaveValue("Excel básico");
    expect(form.getByRole("radio", { name: "Online" })).toBeChecked();
    expect(form.getByRole("checkbox", { name: /Publicar/ })).toBeChecked();
    expect(form.getByText(/relacionado a 1 vaga\./)).toBeVisible();

    await user.clear(form.getByLabelText("Nome do curso *"));
    await user.type(form.getByLabelText("Nome do curso *"), "Excel avançado");
    await user.click(
      await form.findByRole("checkbox", { name: /Trabalho em grupo/ }),
    );
    await user.click(form.getByRole("button", { name: "Remover Excel" }));
    await user.click(form.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Curso “Excel avançado” atualizado."),
    ).toBeVisible();
    const patch = stub?.requests.find((request) => request.method === "patch");
    expect(patch?.body).toEqual({
      title: "Excel avançado",
      institution: "Instituto Sintético",
      mode: "online",
      external_link: "https://example.invalid/excel",
      published: true,
      skill_ids: [teamwork.id],
    });
  });

  it("keeps the typed values and offers a retry when saving fails", async () => {
    const user = mount({
      [publishedRoute]: {
        status: 500,
        data: { title: "Server Error", status: 500 },
      },
    });

    await shown("Excel básico");
    await user.click(
      screen.getByRole("button", { name: "Editar Excel básico" }),
    );
    const form = within(await screen.findByRole("dialog"));
    await user.type(form.getByLabelText("Nome do curso *"), " 2");
    await user.click(form.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await form.findByText(/Não foi possível salvar o curso/),
    ).toBeVisible();
    expect(form.getByLabelText("Nome do curso *")).toHaveValue(
      "Excel básico 2",
    );
    expect(
      form.getByRole("button", { name: "Salvar alterações" }),
    ).toBeEnabled();
  });

  it("shows a missing skill on the skills field", async () => {
    const user = mount({
      "POST /admin/trainings": {
        status: 422,
        data: {
          title: "Unprocessable Content",
          status: 422,
          code: "training_relation_not_found",
        },
      },
    });

    await shown("Excel básico");
    await user.click(screen.getByRole("button", { name: "Novo curso" }));
    const form = within(await screen.findByRole("dialog"));
    await user.type(form.getByLabelText("Nome do curso *"), "Curso");
    await user.type(form.getByLabelText("Instituição *"), "Escola");
    await user.click(form.getByRole("radio", { name: "Remoto" }));
    await user.type(
      form.getByLabelText("Link do curso *"),
      "https://example.invalid/curso",
    );
    await user.click(form.getByRole("button", { name: "Cadastrar curso" }));

    expect(
      await form.findByText(/Alguma competência escolhida não existe mais/),
    ).toBeVisible();
  });

  it("searches the skill catalog inside the form", async () => {
    const user = mount();

    await shown("Excel básico");
    await user.click(screen.getByRole("button", { name: "Novo curso" }));
    const form = within(await screen.findByRole("dialog"));
    await form.findByRole("checkbox", { name: /Excel/ });
    await user.type(form.getByLabelText("Competências relacionadas"), "exc");

    await waitFor(() =>
      expect(
        stub?.requests.some(
          (request) =>
            request.url === "/skills" &&
            (request.params as { search?: string }).search === "exc",
        ),
      ).toBe(true),
    );
  });

  it("inactivates a course only after confirmation", async () => {
    const user = mount({
      [publishedRoute]: {
        status: 200,
        data: { ...published, published: false },
      },
    });

    await shown("Excel básico");
    await user.click(
      screen.getByRole("button", { name: "Inativar Excel básico" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(
        /As competências e as vagas relacionadas são mantidas/,
      ),
    ).toBeVisible();
    expect(
      stub?.requests.filter((request) => request.method === "patch"),
    ).toHaveLength(0);

    await user.click(
      within(dialog).getByRole("button", { name: "Inativar curso" }),
    );

    expect(
      await screen.findByText(/Curso “Excel básico” inativado/),
    ).toBeVisible();
    expect(
      stub?.requests.find((request) => request.method === "patch")?.body,
    ).toEqual({ published: false });
  });

  it("cancels an inactivation without calling the API", async () => {
    const user = mount();

    await shown("Excel básico");
    await user.click(
      screen.getByRole("button", { name: "Inativar Excel básico" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancelar",
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(
      stub?.requests.filter((request) => request.method === "patch"),
    ).toHaveLength(0);
  });

  it("reports a failed inactivation inside the confirmation", async () => {
    const user = mount({
      [publishedRoute]: {
        status: 404,
        data: { title: "Not Found", status: 404, code: "training_not_found" },
      },
    });

    await shown("Excel básico");
    await user.click(
      screen.getByRole("button", { name: "Inativar Excel básico" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Inativar curso",
      }),
    );

    expect(
      await within(screen.getByRole("alertdialog")).findByText(
        "Este curso não está mais disponível. Atualize a lista.",
      ),
    ).toBeVisible();
  });

  it("reactivates a course at once and reports a failed reactivation", async () => {
    let attempts = 0;
    const user = mount({
      [unpublishedRoute]: () => {
        attempts += 1;
        return attempts === 1
          ? { status: 500, data: { title: "Server Error", status: 500 } }
          : { status: 200, data: { ...unpublished, published: true } };
      },
    });

    await shown("Liderança prática");
    const button = screen.getByRole("button", {
      name: "Reativar Liderança prática",
    });
    await user.click(button);
    expect(
      await screen.findByText(
        "Não foi possível reativar o curso. Tente novamente.",
      ),
    ).toBeVisible();

    await user.click(button);
    expect(
      await screen.findByText(/Curso “Liderança prática” reativado/),
    ).toBeVisible();
    expect(
      stub?.requests
        .filter((request) => request.method === "patch")
        .map((request) => request.body),
    ).toEqual([{ published: true }, { published: true }]);
  });
});
