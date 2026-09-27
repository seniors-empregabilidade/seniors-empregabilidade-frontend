import { z } from "zod";

import { apiClient } from "@/lib/api-client";

export const searchSchema = z.object({
  search: z
    .string()
    .max(50, { message: "O nome da empresa deve ter no máximo 50 caracteres." })
    .optional(),
});

export type SearchForm = z.infer<typeof searchSchema>;

export const applicationStatusSchema = z.enum([
  "applied",
  "under_review",
  "in_selection_process",
  "hired",
  "not_selected",
  "withdrawn",
  "expired",
]);

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

const similarJobSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  company_name: z.string(),
});

const applicationSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  job_title: z.string(),
  company_name: z.string(),
  submitted_at: z.string().datetime(),
  days_in_process: z.number(),
  status: applicationStatusSchema,
  similar_jobs: z.array(similarJobSchema),
});

export const applicationsResponseSchema = z.array(applicationSchema);

export type Application = z.infer<typeof applicationSchema>;

interface FetchApplicationsParams {
  companyName?: string;
  signal?: AbortSignal;
}

export async function fetchApplications({
  companyName,
  signal,
}: FetchApplicationsParams = {}): Promise<Application[]> {
  const response = await apiClient.get<unknown>("/applications/me", {
    ...(companyName ? { params: { company_name: companyName } } : {}),
    ...(signal ? { signal } : {}),
  });

  return applicationsResponseSchema.parse(response.data);
}
