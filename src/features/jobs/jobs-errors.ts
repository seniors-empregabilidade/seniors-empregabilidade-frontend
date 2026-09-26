import { ApiError } from "@/lib/api-error";

import type { JobPostingValues } from "./job-posting-schema";

type JobPostingField = keyof JobPostingValues;

export interface JobPostingFailure {
  message: string;
  fields: { field: JobPostingField; message: string }[];
}

const GENERIC_PUBLISH_ERROR =
  "Não foi possível publicar a vaga. Seus dados foram mantidos; tente novamente.";
const GENERIC_LIST_ERROR =
  "Não foi possível carregar suas vagas. Tente novamente.";
const AWAITING_APPROVAL =
  "Sua empresa ainda não foi aprovada. Assim que a aprovação sair, você poderá publicar e acompanhar vagas aqui.";

// FastAPI reports a location such as "body.skills.0.name"; the domain errors
// of the jobs module report the bare field, such as "closing_date".
const fieldsByLocation: Record<string, JobPostingField> = {
  title: "title",
  description: "description",
  work_mode: "workMode",
  closing_date: "closingDate",
  skills: "skills",
};

const fieldMessages: Record<JobPostingField, string> = {
  title: "Confira o título: use de 1 a 150 caracteres.",
  description: "Confira a descrição: use até 5000 caracteres.",
  workMode: "Escolha a modalidade de trabalho.",
  closingDate: "A data de encerramento não pode estar no passado.",
  skills:
    "Confira as habilidades: cada uma precisa ter letras ou números e até 100 caracteres.",
};

const publishMessages: Record<string, string> = {
  validation_error: "Confira os campos destacados e tente novamente.",
  closing_date_in_the_past: "Confira a data de encerramento.",
  approved_company_required: AWAITING_APPROVAL,
  invalid_access_token:
    "Sua sessão expirou. Entre novamente para publicar a vaga.",
  invalid_job_response:
    "Não conseguimos confirmar a publicação. Confira a lista de vagas antes de tentar de novo.",
};

/**
 * The API's `detail` is English operator text (problem+json), so a failure is
 * mapped by `code` to the Portuguese the person reads, and field errors are
 * placed on the form field they belong to.
 */
export function jobPostingFailure(error: unknown): JobPostingFailure {
  if (!(error instanceof ApiError) || !error.code)
    return { message: GENERIC_PUBLISH_ERROR, fields: [] };

  return {
    message: publishMessages[error.code] ?? GENERIC_PUBLISH_ERROR,
    fields: fieldErrors(error.errors),
  };
}

export function isAwaitingApproval(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === "approved_company_required"
  );
}

export function myJobsErrorMessage(error: unknown): string {
  return isAwaitingApproval(error) ? AWAITING_APPROVAL : GENERIC_LIST_ERROR;
}

function fieldErrors(
  errors: Record<string, string[]> | undefined,
): JobPostingFailure["fields"] {
  const fields = new Set<JobPostingField>();
  for (const location of Object.keys(errors ?? {})) {
    const parts = location.split(".");
    const name = parts[0] === "body" ? parts[1] : parts[0];
    const field = name === undefined ? undefined : fieldsByLocation[name];
    if (field) fields.add(field);
  }
  return [...fields].map((field) => ({ field, message: fieldMessages[field] }));
}
