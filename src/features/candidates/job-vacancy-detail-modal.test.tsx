import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";

import * as api from "./job-vacancies-api";
import { JobVacancyDetailModal } from "./job-vacancy-detail-modal";
import type { JobVacancy } from "./job-vacancy-schema";

vi.mock("./job-vacancies-api", async () => {
  const actual = await vi.importActual<typeof api>("./job-vacancies-api");
  return {
    ...actual,
    applyToJobVacancy: vi.fn(),
  };
});

const vacancy: JobVacancy = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Supervisor de logística",
  description:
    "Coordenar equipe de 25 pessoas no centro de distribuição da zona leste.",
  company_name: "Moveve Distribuição",
  city: "São Paulo",
  state: "SP",
  work_mode: "onsite",
  salary_min: 6500,
  salary_max: 8000,
  published_at: "2026-09-23",
  status: "open",
  has_applied: false,
  skills: [
    "Gestão de equipe operacional",
    "Indicadores de produtividade",
    "Excel avançado",
    "Certificação NR-11",
  ],
};

function mount(
  props: Partial<ComponentProps<typeof JobVacancyDetailModal>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <JobVacancyDetailModal
        vacancy={vacancy}
        open
        onOpenChange={vi.fn()}
        candidateSkillNames={[
          "Gestão de equipe operacional",
          "Indicadores de produtividade",
          "Excel avançado",
        ]}
        {...props}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.applyToJobVacancy).mockResolvedValue({
    id: "22222222-2222-4222-8222-222222222222",
  });
});

describe("JobVacancyDetailModal", () => {
  it("shows company, location, work mode, salary, description and requirements", async () => {
    mount();

    expect(
      await screen.findByRole("heading", { name: "Supervisor de logística" }),
    ).toBeVisible();
    expect(screen.getByText("Moveve Distribuição")).toBeVisible();
    expect(screen.getByText(/São Paulo, SP/)).toBeVisible();
    expect(screen.getByText(/Presencial/)).toBeVisible();
    expect(screen.getByText(/R\$ 6\.500 a R\$ 8\.000/)).toBeVisible();
    expect(screen.getByText(/Coordenar equipe de 25 pessoas/)).toBeVisible();
    expect(screen.getByText("Você atende 3 de 4 requisitos")).toBeVisible();
    expect(screen.getByText("Certificação NR-11")).toBeVisible();
    expect(screen.getByText("Habilidade em falta:")).toBeVisible();
  });

  it("sends the application and keeps the new state on the same screen", async () => {
    mount();

    await userEvent.click(
      screen.getByRole("button", { name: "Candidatar-se" }),
    );

    expect(await screen.findByText("Candidatura enviada")).toBeVisible();
    expect(screen.getByText("Sucesso")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Já candidatado" }),
    ).toBeDisabled();
    expect(api.applyToJobVacancy).toHaveBeenCalledWith(vacancy.id);
    expect(
      screen.getByRole("heading", { name: "Supervisor de logística" }),
    ).toBeVisible();
  });

  it("shows a loading label on the apply button while the request is in flight", async () => {
    let complete!: (value: api.JobApplication) => void;
    vi.mocked(api.applyToJobVacancy).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );

    mount();
    await userEvent.click(
      screen.getByRole("button", { name: "Candidatar-se" }),
    );

    expect(
      screen.getByRole("button", { name: "Enviando candidatura…" }),
    ).toBeDisabled();

    complete({ id: "22222222-2222-4222-8222-222222222222" });
    expect(await screen.findByText("Candidatura enviada")).toBeVisible();
  });

  it("shows an error and keeps the apply button when the request fails", async () => {
    vi.mocked(api.applyToJobVacancy).mockRejectedValue(
      new ApiError({
        message: "Application already exists",
        code: "already_applied",
      }),
    );

    mount();
    await userEvent.click(
      screen.getByRole("button", { name: "Candidatar-se" }),
    );

    expect(
      await screen.findByText("Você já se candidatou a esta vaga."),
    ).toBeVisible();
    expect(screen.getByText("Erro")).toBeVisible();
    expect(screen.getByRole("button", { name: "Candidatar-se" })).toBeEnabled();
  });

  it("disables apply when the professional already applied", () => {
    mount({
      vacancy: { ...vacancy, has_applied: true },
    });

    expect(
      screen.getByRole("button", { name: "Já candidatado" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Candidatar-se" }),
    ).not.toBeInTheDocument();
  });

  it("disables apply when the vacancy is closed", () => {
    mount({
      vacancy: { ...vacancy, status: "closed" },
    });

    expect(
      screen.getByRole("button", { name: "Vaga encerrada" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Candidatar-se" }),
    ).not.toBeInTheDocument();
  });

  it("explains when the vacancy lists no skill requirements", () => {
    mount({
      vacancy: { ...vacancy, skills: [] },
    });

    expect(
      screen.getByText("Esta vaga ainda não listou requisitos de habilidades."),
    ).toBeVisible();
  });

  it("closes from the footer without sending an application", async () => {
    const onOpenChange = vi.fn();
    mount({ onOpenChange });

    const [footerClose] = screen.getAllByRole("button", { name: "Fechar" });
    await userEvent.click(footerClose!);

    await waitFor(() =>
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()),
    );
    expect(api.applyToJobVacancy).not.toHaveBeenCalled();
  });
});
