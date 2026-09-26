import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";

import * as api from "./job-postings-api";
import { JobPostingModal } from "./job-posting-modal";

vi.mock("./job-postings-api", () => ({
  createJobPosting: vi.fn(),
}));

const created = {
  id: "11111111-1111-4111-8111-111111111111",
};

function mount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <JobPostingModal />
    </QueryClientProvider>,
  );
}

async function openModal() {
  await userEvent.click(
    screen.getByRole("button", { name: "Cadastrar nova vaga" }),
  );
  await screen.findByRole("heading", { name: "Cadastrar nova vaga" });
}

async function fillValidForm() {
  await userEvent.type(
    screen.getByLabelText("Título da vaga *"),
    "Desenvolvedor(a) Frontend",
  );
  await userEvent.type(
    screen.getByLabelText("Descrição da vaga *"),
    "Vaga para atuar no time de frontend do produto.",
  );
  await userEvent.type(
    screen.getByLabelText("Habilidades necessárias *"),
    "React{Enter}",
  );
}

async function submit() {
  await userEvent.click(screen.getByRole("button", { name: "Publicar vaga" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.createJobPosting).mockResolvedValue(created);
});

describe("Job posting modal", () => {
  it("opens from the trigger button and closes on cancel without submitting", async () => {
    mount();
    await openModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("heading", { name: "Cadastrar nova vaga" }),
    ).not.toBeInTheDocument();
    expect(api.createJobPosting).not.toHaveBeenCalled();
  });

  it("requires a title and at least one skill before publishing", async () => {
    mount();
    await openModal();
    await userEvent.type(
      screen.getByLabelText("Título da vaga *"),
      "Desenvolvedor(a) Frontend",
    );
    await submit();
    expect(
      await screen.findByText("Adicione pelo menos uma habilidade."),
    ).toBeInTheDocument();
    expect(api.createJobPosting).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Título da vaga *")).toHaveValue(
      "Desenvolvedor(a) Frontend",
    );
  });

  it("adds skills as removable chips and ignores duplicates", async () => {
    mount();
    await openModal();
    const skillsInput = screen.getByLabelText("Habilidades necessárias *");
    await userEvent.type(skillsInput, "React{Enter}");
    await userEvent.type(skillsInput, "React{Enter}");
    expect(screen.getAllByText("React")).toHaveLength(1);
    expect(skillsInput).toHaveValue("");

    await userEvent.click(
      screen.getByRole("button", { name: "Remover habilidade React" }),
    );
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("publishes a job posting with valid data and closes the modal", async () => {
    mount();
    await openModal();
    await fillValidForm();
    await submit();
    await waitFor(() => expect(api.createJobPosting).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createJobPosting).mock.calls[0]![0]).toEqual({
      title: "Desenvolvedor(a) Frontend",
      description: "Vaga para atuar no time de frontend do produto.",
      skills: ["React"],
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Cadastrar nova vaga" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows a general error and keeps entered data when publishing fails", async () => {
    vi.mocked(api.createJobPosting).mockRejectedValue(
      new ApiError({
        message: "Não foi possível publicar a vaga. Tente novamente.",
        code: "job_posting_unavailable",
      }),
    );
    mount();
    await openModal();
    await fillValidForm();
    await submit();
    expect(
      await screen.findByText(
        "Não foi possível publicar a vaga. Tente novamente.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Título da vaga *")).toHaveValue(
      "Desenvolvedor(a) Frontend",
    );
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("disables the form and shows a loading state while publishing", async () => {
    let complete!: (value: api.JobPosting) => void;
    vi.mocked(api.createJobPosting).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    mount();
    await openModal();
    await fillValidForm();
    await submit();
    expect(screen.getByRole("button", { name: "Publicando…" })).toBeDisabled();
    expect(screen.getByLabelText("Título da vaga *")).toBeDisabled();
    complete(created);
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Cadastrar nova vaga" }),
      ).not.toBeInTheDocument(),
    );
  });
});
