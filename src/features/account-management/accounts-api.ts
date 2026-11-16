import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { type DownloadedFile, fetchFile } from "@/lib/download-file";

const ACCOUNTS_ENDPOINT = "/admin/accounts";

export const ACCOUNTS_PAGE_SIZE = 20;
export const REASON_MAX_LENGTH = 500;

const userTypeSchema = z.enum(["candidate", "company"]);
const accountStatusSchema = z.enum(["active", "suspended", "blocked"]);
const companyStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "blocked",
]);

const accountSummarySchema = z.object({
  id: z.uuid(),
  user_type: userTypeSchema,
  email: z.string(),
  display_name: z.string().nullable(),
  account_status: accountStatusSchema,
  company_status: companyStatusSchema.nullable(),
  completion_percentage: z.number().int().nullable(),
  missing_fields: z.array(z.string()).nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

const accountListSchema = z.object({
  items: z.array(accountSummarySchema),
  total: z.number().int().nonnegative(),
});

const accountStatusResponseSchema = z.object({
  id: z.uuid(),
  account_status: accountStatusSchema,
});

export type UserTypeFilter = z.infer<typeof userTypeSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type WritableAccountStatus = "active" | "blocked";
const accountExperienceSchema = z.object({
  id: z.uuid(),
  role: z.string(),
  company_name: z.string(),
  start_date: z.iso.date(),
  end_date: z.iso.date().nullable(),
});

const accountEducationSchema = z.object({
  id: z.uuid(),
  institution: z.string(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  start_date: z.iso.date().nullable(),
  end_date: z.iso.date().nullable(),
});

const accountSkillSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const accountDetailSchema = accountSummarySchema.extend({
  application_count: z.number().int().nonnegative().nullable(),
  summary: z.string().nullable(),
  experiences: z.array(accountExperienceSchema),
  education: z.array(accountEducationSchema),
  skills: z.array(accountSkillSchema),
  legal_name: z.string().nullable(),
  trade_name: z.string().nullable(),
  cnpj: z.string().nullable(),
  corporate_email: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  industry: z.string().nullable(),
  company_size: z.string().nullable(),
  published_job_count: z.number().int().nonnegative().nullable(),
});

export type AccountSummary = z.infer<typeof accountSummarySchema>;
export type AccountList = z.infer<typeof accountListSchema>;
export type AccountExperience = z.infer<typeof accountExperienceSchema>;
export type AccountEducation = z.infer<typeof accountEducationSchema>;
export type AccountDetail = z.infer<typeof accountDetailSchema>;

export interface AccountFilters {
  userType: "all" | UserTypeFilter;
  accountStatus: "all" | AccountStatus;
  companyStatus: "all" | CompanyStatus;
  completeness: "all" | "complete" | "incomplete";
  offset: number;
}

export const defaultAccountFilters: AccountFilters = {
  userType: "all",
  accountStatus: "all",
  companyStatus: "all",
  completeness: "all",
  offset: 0,
};

export const userTypeLabels: Record<UserTypeFilter, string> = {
  candidate: "Profissional",
  company: "Empresa",
};

export const accountStatusLabels: Record<AccountStatus, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  blocked: "Bloqueada",
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Recusada",
  blocked: "Bloqueada",
};

export function accountDisplayName(account: AccountSummary): string {
  const name = account.display_name?.trim();
  return name ? name : account.email;
}

export function completionLabel(
  missingFields: readonly string[] | null,
): string {
  if (missingFields === null) return "—";
  return missingFields.length === 0
    ? "Currículo completo"
    : "Currículo incompleto";
}

function accountFilterParams(filters: AccountFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.userType !== "all") params.set("user_type", filters.userType);
  if (filters.accountStatus !== "all") {
    params.set("account_status", filters.accountStatus);
  }
  if (filters.companyStatus !== "all") {
    params.set("company_status", filters.companyStatus);
  }
  if (filters.completeness !== "all") {
    params.set("completeness", filters.completeness);
  }
  return params;
}

export function accountsSearchParams(filters: AccountFilters): string {
  const params = accountFilterParams(filters);
  params.set("limit", String(ACCOUNTS_PAGE_SIZE));
  params.set("offset", String(filters.offset));
  return params.toString();
}

/** Every account matching the filters as CSV; the page position is ignored. */
export function exportAccounts(
  filters: AccountFilters,
): Promise<DownloadedFile> {
  const search = accountFilterParams(filters).toString();
  return fetchFile(
    `${ACCOUNTS_ENDPOINT}/export${search ? `?${search}` : ""}`,
    "cadastros.csv",
  );
}

export async function fetchAccounts(
  filters: AccountFilters,
  signal?: AbortSignal,
): Promise<AccountList> {
  const response = await apiClient.get<unknown>(
    `${ACCOUNTS_ENDPOINT}?${accountsSearchParams(filters)}`,
    signal ? { signal } : undefined,
  );
  const parsed = accountListSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected account list response",
      code: "invalid_account_list_response",
    });
  }
  return parsed.data;
}

export async function fetchAccountDetail(
  accountId: string,
  signal?: AbortSignal,
): Promise<AccountDetail> {
  const response = await apiClient.get<unknown>(
    `${ACCOUNTS_ENDPOINT}/${accountId}`,
    signal ? { signal } : undefined,
  );
  const parsed = accountDetailSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected account detail response",
      code: "invalid_account_detail_response",
    });
  }
  return parsed.data;
}

export const accountsQueryKey = ["administrator", "accounts"] as const;

export function accountDetailQueryOptions(accountId: string) {
  return queryOptions({
    queryKey: [...accountsQueryKey, "detail", accountId],
    queryFn: ({ signal }) => fetchAccountDetail(accountId, signal),
    retry: false,
  });
}

export function accountsQueryOptions(filters: AccountFilters) {
  return queryOptions({
    queryKey: [...accountsQueryKey, filters],
    queryFn: ({ signal }) => fetchAccounts(filters, signal),
    retry: false,
  });
}

export const accountStatusValuesSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { message: "Escreva a justificativa antes de confirmar." })
    .max(REASON_MAX_LENGTH, {
      message: `Use até ${REASON_MAX_LENGTH} caracteres.`,
    }),
});

export type AccountStatusValues = z.infer<typeof accountStatusValuesSchema>;

export async function changeAccountStatus(
  accountId: string,
  status: WritableAccountStatus,
  values: AccountStatusValues,
): Promise<z.infer<typeof accountStatusResponseSchema>> {
  const response = await apiClient.patch<unknown>(
    `${ACCOUNTS_ENDPOINT}/${accountId}/status`,
    { status, reason: values.reason },
  );
  const parsed = accountStatusResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected account status response",
      code: "invalid_account_status_response",
    });
  }
  return parsed.data;
}

export function accountsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "administrator_required" || error.status === 403) {
      return "Apenas administradores podem consultar as contas.";
    }
    if (error.code === "account_not_found") {
      return "Esta conta não está mais disponível. Atualize a lista.";
    }
    if (error.code === "invalid_completion_range") {
      return "A conclusão mínima não pode ser maior que a máxima.";
    }
  }
  return "Não foi possível carregar as contas. Tente novamente.";
}

export function statusChangeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "account_not_found") {
      return "Esta conta não está mais disponível. Atualize a lista.";
    }
    if (error.code === "account_already_blocked") {
      return "Esta conta já está bloqueada.";
    }
    if (error.code === "account_already_active") {
      return "Esta conta já está ativa.";
    }
    if (error.code === "administrator_required" || error.status === 403) {
      return "Apenas administradores podem alterar o status da conta.";
    }
    if (error.code === "validation_error") {
      return `Escreva a justificativa com até ${REASON_MAX_LENGTH} caracteres.`;
    }
  }
  return "Não foi possível alterar o status. A justificativa foi mantida; tente novamente.";
}

export const APPROVAL_REASON_MAX_LENGTH = 2000;

export type CompanyDecision =
  { status: "approved" } | { status: "rejected"; reason: string };

const companyDecisionResponseSchema = z.object({
  id: z.uuid(),
  status: companyStatusSchema,
});

export const companyRejectionValuesSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { message: "Escreva o motivo da recusa antes de confirmar." })
    .max(APPROVAL_REASON_MAX_LENGTH, {
      message: `Use até ${APPROVAL_REASON_MAX_LENGTH} caracteres.`,
    }),
});

export type CompanyRejectionValues = z.infer<
  typeof companyRejectionValuesSchema
>;

export async function decideCompanyApproval(
  companyId: string,
  decision: CompanyDecision,
): Promise<z.infer<typeof companyDecisionResponseSchema>> {
  const response = await apiClient.patch<unknown>(
    `/companies/${encodeURIComponent(companyId)}/approval`,
    decision,
  );
  const parsed = companyDecisionResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected company approval response",
      code: "invalid_company_approval_response",
    });
  }
  return parsed.data;
}

const GENERIC_DECISION_ERROR =
  "Não foi possível registrar a decisão. Tente novamente.";

const decisionMessages: Record<string, string> = {
  company_not_pending:
    "Esta empresa já foi analisada por outra pessoa. A lista foi atualizada.",
  company_activity_required:
    "Esta empresa não tem atividade econômica (CNAE) confirmada e não pode ser aprovada.",
  company_segment_blocked:
    "O segmento desta empresa não é aceito na plataforma. Recuse o cadastro com o motivo.",
  company_not_found: "Esta empresa não está mais disponível. Atualize a lista.",
  invalid_company_decision: `Escreva o motivo da recusa com até ${APPROVAL_REASON_MAX_LENGTH} caracteres.`,
  validation_error: `Escreva o motivo da recusa com até ${APPROVAL_REASON_MAX_LENGTH} caracteres.`,
  administrator_required:
    "Apenas administradores podem aprovar ou recusar empresas.",
};

export function companyDecisionErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.code !== undefined &&
    Object.hasOwn(decisionMessages, error.code)
  ) {
    return decisionMessages[error.code] ?? GENERIC_DECISION_ERROR;
  }
  return GENERIC_DECISION_ERROR;
}
