import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  type JobPostingValues,
  skillTypeSchema,
  workModeSchema,
} from "./job-posting-schema";

const SKILL_SUGGESTION_LIMIT = 6;
export const MIN_SKILL_SEARCH_LENGTH = 2;

export const jobStatusSchema = z.enum([
  "draft",
  "under_review",
  "published",
  "paused",
  "expired",
  "closed",
]);

export type JobStatus = z.infer<typeof jobStatusSchema>;

const catalogSkillSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: skillTypeSchema,
});

export type CatalogSkill = z.infer<typeof catalogSkillSchema>;

// POST /jobs and GET /jobs/me answer with the same job shape (docs/JOBS.md in
// the backend repository).
const jobSchema = z.object({
  id: z.uuid(),
  company_id: z.uuid(),
  title: z.string(),
  description: z.string(),
  skills: z.array(catalogSkillSchema),
  work_mode: workModeSchema,
  closing_date: z.iso.date(),
  status: jobStatusSchema,
  published_at: z.iso.datetime({ offset: true }).nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

export type Job = z.infer<typeof jobSchema>;

export const myJobsQueryKey = ["jobs", "me"] as const;

export async function createJob(values: JobPostingValues): Promise<Job> {
  const response = await apiClient.post<unknown>("/jobs", {
    title: values.title,
    description: values.description,
    skills: values.skills.map(({ name, type }) => ({ name, type })),
    work_mode: values.workMode,
    closing_date: values.closingDate,
  });
  const parsed = jobSchema.safeParse(response.data);
  if (!parsed.success)
    throw new ApiError({
      message: "Não foi possível validar a resposta da publicação da vaga.",
      code: "invalid_job_response",
    });
  return parsed.data;
}

export async function fetchMyJobs(signal?: AbortSignal): Promise<Job[]> {
  const response = await apiClient.get<unknown>(
    "/jobs/me",
    signal ? { signal } : {},
  );
  const parsed = z.array(jobSchema).safeParse(response.data);
  if (!parsed.success)
    throw new ApiError({
      message: "Não foi possível validar a lista de vagas.",
      code: "invalid_jobs_response",
    });
  return parsed.data;
}

export const myJobsQueryOptions = queryOptions({
  queryKey: myJobsQueryKey,
  queryFn: ({ signal }) => fetchMyJobs(signal),
  retry: false,
});

export async function searchSkills(
  search: string,
  signal?: AbortSignal,
): Promise<CatalogSkill[]> {
  const response = await apiClient.get<unknown>("/skills", {
    params: { search, limit: SKILL_SUGGESTION_LIMIT },
    ...(signal ? { signal } : {}),
  });
  const parsed = z.array(catalogSkillSchema).safeParse(response.data);
  if (!parsed.success)
    throw new ApiError({
      message: "Não foi possível validar as sugestões de habilidades.",
      code: "invalid_skills_response",
    });
  return parsed.data;
}

export function skillSuggestionsQueryOptions(search: string) {
  return queryOptions({
    queryKey: ["skills", "suggestions", search] as const,
    queryFn: ({ signal }) => searchSkills(search, signal),
    enabled: search.length >= MIN_SKILL_SEARCH_LENGTH,
    // Suggestions only help typing: a failure leaves the field usable, and the
    // previous list stays on screen while the next one loads.
    retry: false,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
