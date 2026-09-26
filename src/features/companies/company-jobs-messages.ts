import { ApiError } from "@/lib/api-error";

const MESSAGES: Record<string, string> = {
  invalid_company_jobs_response:
    "Não foi possível carregar as suas vagas. Tente novamente.",
  invalid_company_job_response:
    "Não foi possível atualizar o status da vaga. Tente novamente.",
  candidate_required: "Esta área é exclusiva de empresas.",
  invalid_access_token: "Sua sessão expirou. Entre novamente para continuar.",
};

const FALLBACK_MESSAGE =
  "Não foi possível carregar as suas vagas. Tente novamente.";

export function companyJobsErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError) || !error.code) {
    return FALLBACK_MESSAGE;
  }

  return MESSAGES[error.code] ?? FALLBACK_MESSAGE;
}

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  under_review: "Em análise",
  published: "Aberta",
  paused: "Encerrada",
  expired: "Expirada",
};
