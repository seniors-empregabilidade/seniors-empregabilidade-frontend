import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  stubApiRoutes,
  type ApiStub,
  type StubResponse,
  type StubRoute,
} from "../../../tests/api-stub";

import { JobEditModal } from "./job-edit-modal";
import type { JobSummary } from "./jobs-api";

const job: JobSummary = {
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
  application_count: 3,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { application_count, ...jobWithoutApplicationCount } = job;
const saved = {
  ...jobWithoutApplicationCount,
  title: "Desenvolvedor(a) Frontend Sênior",
};
const path = `PATCH /jobs/${job.id}`;

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function mount(
  routes: Record<string, StubRoute> = {},
  props: { job?: JobSummary; withClose?: boolean } = {},
) {
  stub = stubApiRoutes({
    [path]: { status: 200, data: saved },
    "GET /skills": { status: 200, data: [] },
    ...routes,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onSaved = vi.fn();
  const onRequestClose = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <JobEditModal
        job={props.job ?? job}
        onSaved={onSaved}
        {...(props.withClose ? { onRequestClose } : {})}
      />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), queryClient, onSaved, onRequestClose };
}

function saveRequests() {
  return stub?.requests.filter((request) => request.method === "patch") ?? [];
}

async function openModal(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Editar" }));
  await screen.findByRole("heading", { name: "Editar vaga" });
}

function problem(status: number, code: string, errors?: object): StubResponse {
  return {
    status,
    data: { title: "Problem", status, code, detail: "English text", errors },
  };
}

function addedSkills() {
  return within(screen.getByRole("list", { name: "Habilidades adicionadas" }));
}

async function expectClosed() {
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Editar vaga" }),
    ).not.toBeInTheDocument(),
  );
}

describe("Job edit modal", () => {
  it("opens already filled with the job and without the fields it does not edit", async () => {
    const { user } = mount();
    await openModal(user);

    expect(screen.getByLabelText("Título da vaga *")).toHaveValue(job.title);
    const description = screen.getByLabelText("Descrição da vaga");
    expect(description).toHaveValue(job.description);
    expect(description).not.toBeRequired();
    expect(addedSkills().getAllByRole("listitem")).toHaveLength(2);
    expect(addedSkills().getByText("React")).toBeInTheDocument();
    expect(addedSkills().getByText("· Comportamental")).toBeInTheDocument();
    expect(screen.queryByLabelText("Data de encerramento *")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Remoto" })).toBeNull();
  });

  it("discards what was typed on cancel and reopens with the job's data", async () => {
    const { user } = mount();
    await openModal(user);
    const title = screen.getByLabelText("Título da vaga *");
    await user.clear(title);
    await user.type(title, "Outro título");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await expectClosed();
    expect(saveRequests()).toHaveLength(0);
    await openModal(user);
    expect(screen.getByLabelText("Título da vaga *")).toHaveValue(job.title);
  });

  it("blocks saving without a title or a skill and says what each field needs", async () => {
    const { user } = mount();
    await openModal(user);
    await user.clear(screen.getByLabelText("Título da vaga *"));
    await user.click(
      screen.getByRole("button", { name: "Remover habilidade React" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remover habilidade Comunicação" }),
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      screen.getByLabelText("Título da vaga *"),
    ).toHaveAccessibleDescription("Preencha este campo.");
    expect(
      screen.getByLabelText("Habilidades necessárias *"),
    ).toHaveAccessibleDescription(
      expect.stringContaining("Adicione pelo menos uma habilidade."),
    );
    expect(saveRequests()).toHaveLength(0);
  });

  it("saves the edited fields with structured skills, then closes and reports the stored job", async () => {
    const { user, queryClient, onSaved } = mount();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await openModal(user);
    const title = screen.getByLabelText("Título da vaga *");
    await user.clear(title);
    await user.type(title, saved.title);
    await user.click(
      screen.getByRole("button", { name: "Remover habilidade Comunicação" }),
    );
    await user.click(screen.getByRole("radio", { name: "Comportamental" }));
    await user.type(
      screen.getByLabelText("Habilidades necessárias *"),
      "Liderança{Enter}",
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await expectClosed();
    expect(saveRequests()).toHaveLength(1);
    expect(saveRequests()[0]?.body).toEqual({
      title: saved.title,
      description: job.description,
      skills: [
        { name: "React", type: "hard" },
        { name: "Liderança", type: "soft" },
      ],
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["jobs", "me"] });
  });

  it("saves a job without a description, which the API allows", async () => {
    const { user, onSaved } = mount({}, { job: { ...job, description: "" } });
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await expectClosed();
    expect(saveRequests()[0]?.body).toMatchObject({ description: "" });
    expect(onSaved).toHaveBeenCalled();
  });

  it("saves a job whose closing date has passed", async () => {
    const { user, onSaved } = mount(
      {},
      { job: { ...job, closing_date: "2020-01-31", status: "closed" } },
    );
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await expectClosed();
    expect(saveRequests()).toHaveLength(1);
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows server field errors on their fields and keeps what was typed", async () => {
    const { user, onSaved } = mount({
      [path]: problem(422, "validation_error", {
        "body.title": ["String should have at most 150 characters"],
      }),
    });
    await openModal(user);
    const title = screen.getByLabelText("Título da vaga *");
    await user.type(title, " revisado");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText(
        "Confira os campos destacados e tente novamente.",
      ),
    ).toBeInTheDocument();
    expect(title).toHaveAccessibleDescription(
      "Confira o título: use de 1 a 150 caracteres.",
    );
    expect(title).toHaveValue(`${job.title} revisado`);
    expect(screen.queryByText("English text")).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("explains a job that no longer exists and refreshes the list only once closed", async () => {
    const { user, queryClient } = mount({
      [path]: problem(404, "job_not_found"),
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText(/Não encontramos essa vaga/),
    ).toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await expectClosed();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["jobs", "me"] });
  });

  it.each([
    ["the network fails", { status: 0 }],
    ["the server fails", problem(500, "internal_error")],
  ])(
    "keeps the modal open with the data when %s",
    async (_, response: StubResponse) => {
      const { user, onSaved } = mount({ [path]: response });
      await openModal(user);

      await user.click(screen.getByRole("button", { name: "Salvar" }));

      expect(
        await screen.findByText(
          "Não foi possível salvar as alterações. Seus dados foram mantidos; tente novamente.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Editar vaga" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Título da vaga *")).toHaveValue(job.title);
      expect(onSaved).not.toHaveBeenCalled();
    },
  );

  it("holds the form while saving and cannot be closed mid-request", async () => {
    let complete!: (response: StubResponse) => void;
    const { user } = mount({
      [path]: () =>
        new Promise<StubResponse>((resolve) => {
          complete = resolve;
        }),
    });
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(screen.getByLabelText("Título da vaga *")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("heading", { name: "Editar vaga" }),
    ).toBeInTheDocument();

    complete({ status: 200, data: saved });
    await expectClosed();
  });

  it("hands closing over to the caller's confirmation without saving", async () => {
    const { user, onRequestClose } = mount({}, { withClose: true });
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Encerrar vaga" }));

    await expectClosed();
    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(saveRequests()).toHaveLength(0);
  });

  it.each([
    [
      "a typed change",
      (user: UserEvent) =>
        user.type(screen.getByLabelText("Título da vaga *"), " revisado"),
    ],
    [
      "a removed skill",
      (user: UserEvent) =>
        user.click(
          screen.getByRole("button", { name: "Remover habilidade React" }),
        ),
    ],
  ])(
    "does not offer closing over %s that was not saved",
    async (_, change: (user: UserEvent) => Promise<void>) => {
      const { user, onRequestClose } = mount({}, { withClose: true });
      await openModal(user);

      await change(user);

      const close = screen.getByRole("button", { name: "Encerrar vaga" });
      expect(close).toBeDisabled();
      expect(close).toHaveAccessibleDescription(
        "Salve ou cancele as alterações para encerrar a vaga.",
      );
      expect(onRequestClose).not.toHaveBeenCalled();
    },
  );

  it("offers no closing when the caller gave none", async () => {
    const { user } = mount();
    await openModal(user);

    expect(screen.queryByRole("button", { name: "Encerrar vaga" })).toBeNull();
  });
});
