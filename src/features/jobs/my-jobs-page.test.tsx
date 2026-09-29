import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  stubApiRoutes,
  type ApiStub,
  type StubResponse,
  type StubRoute,
} from "../../../tests/api-stub";

import { MyJobsPage } from "./my-jobs-page";

const published = {
  id: "11111111-1111-4111-8111-111111111111",
  company_id: "22222222-2222-4222-8222-222222222222",
  title: "Desenvolvedor(a) Frontend",
  description: "Vaga para atuar no time de frontend do produto.",
  skills: [
    { id: "33333333-3333-4333-8333-333333333333", name: "React", type: "hard" },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Comunicação",
      type: "soft",
    },
  ],
  work_mode: "remote",
  closing_date: "2099-12-31",
  status: "published",
  published_at: "2026-09-23T12:00:00Z",
  created_at: "2026-09-23T12:00:00Z",
};

const draft = {
  ...published,
  id: "55555555-5555-4555-8555-555555555555",
  title: "Analista de operações",
  description: "",
  skills: [],
  work_mode: "onsite",
  closing_date: "2099-01-05",
  status: "draft",
  published_at: null,
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function mount(routes: Record<string, StubRoute>) {
  stub = stubApiRoutes({ "GET /skills": { status: 200, data: [] }, ...routes });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MyJobsPage />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

function listRequests() {
  return stub?.requests.filter((request) => request.url === "/jobs/me") ?? [];
}

async function publishThroughTheModal(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Cadastrar nova vaga" }));
  await user.type(
    await screen.findByLabelText("Título da vaga *"),
    published.title,
  );
  await user.type(
    screen.getByLabelText("Descrição da vaga *"),
    published.description,
  );
  await user.click(screen.getByRole("radio", { name: "Remoto" }));
  await user.type(
    screen.getByLabelText("Data de encerramento *"),
    "2099-12-31",
  );
  const skills = screen.getByLabelText("Habilidades necessárias *");
  await user.type(skills, "React{Enter}");
  await user.click(screen.getByRole("radio", { name: "Comportamental" }));
  await user.type(skills, "Comunicação{Enter}");
  await user.click(screen.getByRole("button", { name: "Publicar vaga" }));
}

const EMPTY_STATE = /Você ainda não publicou vagas/;

describe("MyJobsPage", () => {
  it("announces while the jobs load", () => {
    mount({ "GET /jobs/me": () => new Promise<StubResponse>(() => {}) });

    expect(screen.getByText("Carregando suas vagas…")).toBeInTheDocument();
  });

  it("invites a company without jobs to publish the first one", async () => {
    mount({ "GET /jobs/me": { status: 200, data: [] } });

    expect(await screen.findByText(EMPTY_STATE)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Minhas vagas" }),
    ).toBeInTheDocument();
  });

  it("lists each job with its status, work mode, closing date and skills", async () => {
    mount({ "GET /jobs/me": { status: 200, data: [published, draft] } });

    const card = within(
      await screen.findByRole("article", { name: published.title }),
    );
    expect(card.getByText("Aberta")).toBeInTheDocument();
    expect(
      card.getByText("Remoto · Encerra em 31/12/2099"),
    ).toBeInTheDocument();
    expect(card.getByText(published.description)).toBeInTheDocument();
    expect(
      card.getAllByRole("listitem").map((skill) => skill.textContent),
    ).toEqual(["React", "Comunicação"]);

    const draftCard = within(
      screen.getByRole("article", { name: draft.title }),
    );
    expect(draftCard.getByText("Rascunho")).toBeInTheDocument();
    expect(
      draftCard.getByText("Presencial · Encerra em 05/01/2099"),
    ).toBeInTheDocument();
  });

  it("shows a job published in the modal in the list, once the API confirmed it", async () => {
    const stored: unknown[] = [];
    const user = mount({
      "GET /jobs/me": () => ({ status: 200, data: [...stored] }),
      "POST /jobs": () => {
        stored.push(published);
        return { status: 201, data: published };
      },
    });
    await screen.findByText(EMPTY_STATE);

    await publishThroughTheModal(user);

    const card = await screen.findByRole("article", { name: published.title });
    expect(within(card).getByText("Comunicação")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_STATE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Cadastrar nova vaga" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        `A vaga “${published.title}” foi publicada e já aparece na lista.`,
      ),
    ).toBeInTheDocument();
    expect(
      stub?.requests.find((request) => request.method === "post")?.body,
    ).toMatchObject({
      skills: [
        { name: "React", type: "hard" },
        { name: "Comunicação", type: "soft" },
      ],
    });
  });

  it("leaves the list as the server has it when publishing fails", async () => {
    const user = mount({
      "GET /jobs/me": { status: 200, data: [] },
      "POST /jobs": {
        status: 500,
        data: {
          title: "Internal Server Error",
          status: 500,
          code: "internal_error",
        },
      },
    });
    await screen.findByText(EMPTY_STATE);

    await publishThroughTheModal(user);

    expect(
      await screen.findByText(
        "Não foi possível publicar a vaga. Seus dados foram mantidos; tente novamente.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(listRequests()).toHaveLength(2));
    expect(screen.getByText(EMPTY_STATE)).toBeInTheDocument();
    expect(screen.queryByText("Sucesso")).not.toBeInTheDocument();
  });

  it("offers a retry when the list cannot be loaded", async () => {
    let attempts = 0;
    const user = mount({
      "GET /jobs/me": () => {
        attempts += 1;
        return attempts === 1
          ? { status: 0 }
          : { status: 200, data: [published] };
      },
    });

    expect(
      await screen.findByText(
        "Não foi possível carregar suas vagas. Tente novamente.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByRole("article", { name: published.title }),
    ).toBeInTheDocument();
  });

  it("tells a company awaiting approval why it cannot publish yet", async () => {
    mount({
      "GET /jobs/me": {
        status: 403,
        data: {
          title: "Forbidden",
          status: 403,
          code: "approved_company_required",
        },
      },
    });

    expect(
      await screen.findByText(/ainda não foi aprovada/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cadastrar nova vaga" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
  });
});
