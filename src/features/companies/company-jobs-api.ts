import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  companyJobSchema,
  companyJobsSchema,
  type CompanyJob,
  type CompanyJobStatus,
} from "./company-jobs-schema";

// TODO: confirmar os paths com a US-18-T01 antes do merge. O backend hoje só
// expõe POST /jobs; a listagem e a mudança de status ainda não existem.
const JOBS_ENDPOINT = "/jobs";
const COMPANY_JOBS_ENDPOINT = `${JOBS_ENDPOINT}/me`;

export const companyJobsQueryKey = ["companies", "jobs"] as const;

export async function fetchCompanyJobs(
  signal?: AbortSignal,
): Promise<CompanyJob[]> {
  const response = await apiClient.get<unknown>(
    COMPANY_JOBS_ENDPOINT,
    signal ? { signal } : {},
  );

  const parsed = companyJobsSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível carregar as suas vagas.",
      code: "invalid_company_jobs_response",
    });
  }

  return parsed.data;
}

export const companyJobsQueryOptions = queryOptions({
  queryKey: companyJobsQueryKey,
  queryFn: ({ signal }) => fetchCompanyJobs(signal),
  retry: false,
});

export async function updateCompanyJobStatus(input: {
  id: string;
  status: CompanyJobStatus;
}): Promise<CompanyJob> {
  const response = await apiClient.patch<unknown>(
    `${JOBS_ENDPOINT}/${input.id}/status`,
    { status: input.status },
  );

  const parsed = companyJobSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível atualizar o status da vaga.",
      code: "invalid_company_job_response",
    });
  }

  return parsed.data;
}
