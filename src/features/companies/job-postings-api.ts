import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import type { JobPostingValues } from "./job-posting-schema";

// TODO: confirmar com o time o path do endpoint e o formato exato da
// resposta do backend para a US-17 (T01/T02) antes de finalizar o PR.
const jobPostingResponseSchema = z.object({
  id: z.uuid(),
});

export type JobPosting = z.infer<typeof jobPostingResponseSchema>;

export async function createJobPosting(
  values: JobPostingValues,
): Promise<JobPosting> {
  const response = await apiClient.post<unknown>("/job-postings", {
    title: values.title,
    description: values.description,
    skills: values.skills,
  });
  const parsed = jobPostingResponseSchema.safeParse(response.data);
  if (!parsed.success)
    throw new ApiError({
      message: "Não foi possível validar a resposta da publicação da vaga.",
      code: "invalid_job_posting_response",
    });
  return parsed.data;
}
