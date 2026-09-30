import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  jobApplicationSchema,
  type JobApplication,
} from "./job-vacancy-schema";

export type { JobApplication };

export async function applyToJobVacancy(
  jobPostingId: string,
  signal?: AbortSignal,
): Promise<JobApplication> {
  const response = await apiClient.post<unknown>(
    `/job-postings/${jobPostingId}/applications`,
    {},
    signal ? { signal } : {},
  );

  const parsed = jobApplicationSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a resposta da candidatura.",
      code: "invalid_job_application_response",
    });
  }

  return parsed.data;
}
