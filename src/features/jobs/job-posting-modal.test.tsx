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

import { JobPostingModal } from "./job-posting-modal";

const created = {
  id: "11111111-1111-4111-8111-111111111111",
  company_id: "22222222-2222-4222-8222-222222222222",
  title: "Desenvolvedor(a) Frontend",
  description: "Vaga para atuar no time de frontend do produto.",
  skills: [
    { id: "33333333-3333-4333-8333-333333333333", name: "React", type: "hard" },
  ],
  work_mode: "remote",
  closing_date: "2099-12-31",
  status: "published",
  published_at: "2026-09-23T12:00:00Z",
  created_at: "2026-09-23T12:00:00Z",
};

const catalogSkill = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Gestão de equipes",
  type: "soft",
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

function mount(routes: Record<string, StubRoute> = {}) {
  stub = stubApiRoutes({
    "POST /jobs": { status: 201, data: created },
    "GET /skills": { status: 200, data: [] },
    ...routes,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onPublished = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <JobPostingModal onPublished={onPublished} />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), queryClient, onPublished };
}

function publishRequests() {
  return stub?.requests.filter((request) => request.method === "post") ?? [];
}

async function openModal(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Cadastrar nova vaga" }));
  await screen.findByRole("heading", { name: "Cadastrar nova vaga" });
}

async function fillValidForm(user: UserEvent) {
  await user.type(
    screen.getByLabelText("Título da vaga *"),
    "Desenvolvedor(a) Frontend",
  );
  await user.type(
    screen.getByLabelText("Descrição da vaga *"),
    "Vaga para atuar no time de frontend do produto.",
  );
  await user.click(screen.getByRole("radio", { name: "Remoto" }));
  await user.type(
    screen.getByLabelText("Data de encerramento *"),
    "2099-12-31",
  );
  await user.type(
    screen.getByLabelText("Habilidades necessárias *"),
    "React{Enter}",
  );
}

async function submit(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Publicar vaga" }));
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
      screen.queryByRole("heading", { name: "Cadastrar nova vaga" }),
    ).not.toBeInTheDocument(),
  );
}

describe("Job posting modal", () => {
  it("opens from the trigger button and closes on cancel without submitting", async () => {
    const { user } = mount();
    await openModal(user);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await expectClosed();
    expect(publishRequests()).toHaveLength(0);
  });

  it("blocks publishing without a title or a skill and says what each field needs", async () => {
    const { user } = mount();
    await openModal(user);

    await submit(user);

    expect(
      await screen.findByText("Adicione pelo menos uma habilidade."),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Título da vaga *"),
    ).toHaveAccessibleDescription("Preencha este campo.");
    expect(screen.getByLabelText("Título da vaga *")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      screen.getByLabelText("Habilidades necessárias *"),
    ).toHaveAccessibleDescription(
      expect.stringContaining("Adicione pelo menos uma habilidade."),
    );
    expect(
      screen.getByText("Escolha a modalidade de trabalho."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Informe a data de encerramento."),
    ).toBeInTheDocument();
    expect(publishRequests()).toHaveLength(0);
  });

  it("blocks a closing date in the past before calling the API", async () => {
    const { user } = mount();
    await openModal(user);
    await fillValidForm(user);
    const closingDate = screen.getByLabelText("Data de encerramento *");
    await user.clear(closingDate);
    await user.type(closingDate, "2000-01-01");

    await submit(user);

    expect(closingDate).toHaveAccessibleDescription(
      "A data de encerramento não pode estar no passado.",
    );
    expect(publishRequests()).toHaveLength(0);
  });

  it("adds a typed skill with the chosen type and ignores the same name typed differently", async () => {
    const { user } = mount();
    await openModal(user);
    const skillsInput = screen.getByLabelText("Habilidades necessárias *");

    await user.click(screen.getByRole("radio", { name: "Comportamental" }));
    await user.type(skillsInput, "Comunicação{Enter}");
    await user.type(skillsInput, "  COMUNICACAO {Enter}");

    expect(addedSkills().getAllByRole("listitem")).toHaveLength(1);
    expect(addedSkills().getByText("Comunicação")).toBeInTheDocument();
    expect(addedSkills().getByText("· Comportamental")).toBeInTheDocument();
    expect(skillsInput).toHaveValue("");

    await user.click(
      screen.getByRole("button", { name: "Remover habilidade Comunicação" }),
    );
    expect(
      screen.queryByRole("list", { name: "Habilidades adicionadas" }),
    ).not.toBeInTheDocument();
  });

  it("adds a skill with the Adicionar button", async () => {
    const { user } = mount();
    await openModal(user);

    await user.type(
      screen.getByLabelText("Habilidades necessárias *"),
      "Excel",
    );
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(addedSkills().getByText("Excel")).toBeInTheDocument();
    expect(addedSkills().getByText("· Técnica")).toBeInTheDocument();
  });

  it("refuses a skill name made only of accents", async () => {
    const { user } = mount();
    await openModal(user);

    await user.type(
      screen.getByLabelText("Habilidades necessárias *"),
      "´{Enter}",
    );

    expect(
      screen.getByText("Digite uma habilidade com letras ou números."),
    ).toBeInTheDocument();
  });

  it("suggests catalog skills and adds one with its stored spelling and type", async () => {
    const { user } = mount({
      "GET /skills": { status: 200, data: [catalogSkill] },
    });
    await openModal(user);

    await user.type(screen.getByLabelText("Habilidades necessárias *"), "gest");
    await user.click(
      await screen.findByRole("button", {
        name: "Adicionar Gestão de equipes (Comportamental)",
      }),
    );

    expect(addedSkills().getByText("Gestão de equipes")).toBeInTheDocument();
    expect(addedSkills().getByText("· Comportamental")).toBeInTheDocument();
    expect(
      stub?.requests.find((request) => request.url === "/skills"),
    ).toMatchObject({
      params: { search: "gest", limit: 6 },
    });
  });

  it("keeps the catalog spelling and type for a typed name the catalog knows", async () => {
    const { user } = mount({
      "GET /skills": { status: 200, data: [catalogSkill] },
    });
    await openModal(user);
    const skillsInput = screen.getByLabelText("Habilidades necessárias *");

    await user.type(skillsInput, "gestao DE equipes");
    await screen.findByRole("button", {
      name: "Adicionar Gestão de equipes (Comportamental)",
    });
    await user.type(skillsInput, "{Enter}");

    expect(addedSkills().getByText("Gestão de equipes")).toBeInTheDocument();
    expect(addedSkills().getByText("· Comportamental")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Adicionar Gestão de equipes/ }),
    ).not.toBeInTheDocument();
  });

  it("publishes the job with structured skills, then closes and reports the stored job", async () => {
    const { user, queryClient, onPublished } = mount();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await openModal(user);
    await fillValidForm(user);

    await submit(user);

    await expectClosed();
    expect(publishRequests()).toHaveLength(1);
    expect(publishRequests()[0]?.body).toEqual({
      title: "Desenvolvedor(a) Frontend",
      description: "Vaga para atuar no time de frontend do produto.",
      skills: [{ name: "React", type: "hard" }],
      work_mode: "remote",
      closing_date: "2099-12-31",
    });
    expect(onPublished).toHaveBeenCalledWith(created);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["jobs", "me"] });

    await openModal(user);
    expect(screen.getByLabelText("Título da vaga *")).toHaveValue("");
  });

  it("shows server field errors on their fields and keeps the entered data", async () => {
    const { user, onPublished } = mount({
      "POST /jobs": problem(422, "validation_error", {
        "body.title": ["String should have at most 150 characters"],
        "body.skills.0.name": ["Value error"],
      }),
    });
    await openModal(user);
    await fillValidForm(user);

    await submit(user);

    expect(
      await screen.findByText(
        "Confira os campos destacados e tente novamente.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Título da vaga *"),
    ).toHaveAccessibleDescription(
      "Confira o título: use de 1 a 150 caracteres.",
    );
    expect(screen.getByText(/Confira as habilidades/)).toBeInTheDocument();
    expect(screen.queryByText("English text")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Título da vaga *")).toHaveValue(
      "Desenvolvedor(a) Frontend",
    );
    expect(onPublished).not.toHaveBeenCalled();
  });

  it("shows a closing date refused by the server on the closing date field", async () => {
    const { user } = mount({
      "POST /jobs": problem(422, "closing_date_in_the_past", {
        closing_date: ["The closing date cannot be in the past."],
      }),
    });
    await openModal(user);
    await fillValidForm(user);

    await submit(user);

    expect(
      await screen.findByText("Confira a data de encerramento."),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Data de encerramento *"),
    ).toHaveAccessibleDescription(
      "A data de encerramento não pode estar no passado.",
    );
  });

  it.each([
    ["the network fails", { status: 0 }],
    ["the server fails", problem(500, "internal_error")],
  ])(
    "keeps the modal open with the data when %s",
    async (_, response: StubResponse) => {
      const { user, onPublished } = mount({ "POST /jobs": response });
      await openModal(user);
      await fillValidForm(user);

      await submit(user);

      expect(
        await screen.findByText(
          "Não foi possível publicar a vaga. Seus dados foram mantidos; tente novamente.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Cadastrar nova vaga" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Título da vaga *")).toHaveValue(
        "Desenvolvedor(a) Frontend",
      );
      expect(addedSkills().getByText("React")).toBeInTheDocument();
      expect(onPublished).not.toHaveBeenCalled();
    },
  );

  it("holds the form while publishing and cannot be closed mid-request", async () => {
    let complete!: (response: StubResponse) => void;
    const { user } = mount({
      "POST /jobs": () =>
        new Promise<StubResponse>((resolve) => {
          complete = resolve;
        }),
    });
    await openModal(user);
    await fillValidForm(user);

    await submit(user);

    expect(screen.getByRole("button", { name: "Publicando…" })).toBeDisabled();
    expect(screen.getByLabelText("Título da vaga *")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("heading", { name: "Cadastrar nova vaga" }),
    ).toBeInTheDocument();

    complete({ status: 201, data: created });
    await expectClosed();
  });
});
