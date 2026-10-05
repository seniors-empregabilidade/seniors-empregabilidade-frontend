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

const allFields: JobPostingField[] = [
  "title",
  "description",
  "workMode",
  "closingDate",
  "skills",
];

/**
 * The API's `detail` is English operator text (problem+json), so a failure is
 * mapped by `code` to the Portuguese the person reads, and field errors are
 * placed on the form field they belong to.
 */
export function jobPostingFailure(error: unknown): JobPostingFailure {
  return failureFrom(error, publishMessages, GENERIC_PUBLISH_ERROR, allFields);
}

const GENERIC_EDIT_ERROR =
  "Não foi possível salvar as alterações. Seus dados foram mantidos; tente novamente.";

const editMessages: Record<string, string> = {
  validation_error: "Confira os campos destacados e tente novamente.",
  approved_company_required: AWAITING_APPROVAL,
  invalid_access_token:
    "Sua sessão expirou. Entre novamente para salvar a vaga.",
  job_not_found:
    "Não encontramos essa vaga. Feche esta janela e confira a lista de vagas.",
  invalid_job_update_response:
    "Não conseguimos confirmar o salvamento. Confira a lista de vagas antes de tentar de novo.",
};

// The work mode and the closing date are not edited, so an error about them
// has no field on the form to land on.
const editableFields: JobPostingField[] = ["title", "description", "skills"];

/** Same mapping as `jobPostingFailure`, in the words of saving an edit. */
export function jobEditFailure(error: unknown): JobPostingFailure {
  return failureFrom(error, editMessages, GENERIC_EDIT_ERROR, editableFields);
}

function failureFrom(
  error: unknown,
  messages: Record<string, string>,
  generic: string,
  shownFields: JobPostingField[],
): JobPostingFailure {
  if (!(error instanceof ApiError) || !error.code)
    return { message: generic, fields: [] };

  const fields = fieldErrors(error.errors).filter(({ field }) =>
    shownFields.includes(field),
  );
  // "Confira os campos destacados" needs a highlighted field to point at.
  if (error.code === "validation_error" && fields.length === 0)
    return { message: generic, fields };

  return { message: messages[error.code] ?? generic, fields };
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

const statusChangeMessages: Record<string, string> = {
  job_already_open: "Essa vaga já estava aberta. A lista foi atualizada.",
  job_already_closed: "Essa vaga já estava encerrada. A lista foi atualizada.",
  job_status_change_not_allowed:
    "O status dessa vaga não pode ser alterado por aqui.",
  job_not_found: "Não encontramos essa vaga. A lista foi atualizada.",
  closing_date_in_the_past: "A data de encerramento não pode estar no passado.",
  approved_company_required: AWAITING_APPROVAL,
  invalid_access_token: "Sua sessão expirou. Entre novamente.",
};

export function jobStatusChangeErrorMessage(
  error: unknown,
  action: "close" | "reopen",
): string {
  const fallback =
    action === "close"
      ? "Não foi possível encerrar a vaga. Tente novamente."
      : "Não foi possível reabrir a vaga. Tente novamente.";
  if (!(error instanceof ApiError) || !error.code) return fallback;
  return statusChangeMessages[error.code] ?? fallback;
}

export function isClosingDateInThePast(error: unknown): boolean {
  return error instanceof ApiError && error.code === "closing_date_in_the_past";
}
