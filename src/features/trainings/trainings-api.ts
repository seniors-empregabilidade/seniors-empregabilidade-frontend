import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

// US-22-T02 consumes the course list from US-22-T01. Each item follows the
// persisted `training` columns. `skill` filters that list; a blank value lists
// the published courses. The page is a JSON array, same shape as job search.
const TRAININGS_ENDPOINT = "/trainings";
export const COURSE_PAGE_SIZE = 20;
// A skill phrase, not a catalog id. Capped so the filter cannot grow without
// bound before it reaches the API.
export const SKILL_SEARCH_MAX_LENGTH = 150;

export const trainingModeSchema = z.enum([
  "onsite",
  "hybrid",
  "remote",
  "online",
]);

export const courseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  provider: z.string().nullable(),
  training_mode: trainingModeSchema.nullable(),
  workload_hours: z.number().int().nonnegative().nullable(),
  free: z.boolean(),
  external_link: z.string(),
});

export type TrainingMode = z.infer<typeof trainingModeSchema>;
export type Course = z.infer<typeof courseSchema>;

export async function fetchCourses(
  skill: string,
  signal?: AbortSignal,
): Promise<Course[]> {
  const trimmed = skill.trim();
  const response = await apiClient.get<unknown>(TRAININGS_ENDPOINT, {
    params: {
      limit: COURSE_PAGE_SIZE,
      offset: 0,
      ...(trimmed === "" ? {} : { skill: trimmed }),
    },
    ...(signal ? { signal } : {}),
  });

  const parsed = z.array(courseSchema).safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível carregar os cursos.",
      code: "invalid_course_search_response",
    });
  }
  return parsed.data;
}

export function courseSearchQueryOptions(skill: string) {
  return queryOptions({
    queryKey: ["trainings", "search", skill] as const,
    queryFn: ({ signal }) => fetchCourses(skill, signal),
    retry: false,
  });
}
