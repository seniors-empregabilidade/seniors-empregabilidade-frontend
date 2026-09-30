import { ApiError } from "@/lib/api-error";

const GENERIC_APPLY_ERROR =
  "Não foi possível enviar a candidatura. Tente novamente.";

const applyMessages: Record<string, string> = {
  already_applied: "Você já se candidatou a esta vaga.",
  job_closed: "Esta vaga está encerrada.",
  job_not_found: "Não encontramos esta vaga.",
  invalid_job_application_response: GENERIC_APPLY_ERROR,
};

export function applyToJobVacancyErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code) {
    return applyMessages[error.code] ?? GENERIC_APPLY_ERROR;
  }

  return GENERIC_APPLY_ERROR;
}
