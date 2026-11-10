import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { skillTypes } from "@/lib/skill-type";

// US-22-T02 consumes `GET /trainings` from US-22-T01: a page of published
// courses (`items`) plus how many match in total. `skill` filters by any
// catalog skill whose name contains the text; a blank value lists them all.
const TRAININGS_ENDPOINT = "/trainings";
export const COURSE_PAGE_SIZE = 20;
// A skill phrase, not a catalog id. Same cap as the API (a catalog skill name
// has at most 100 characters); a longer text would get a 422.
export const SKILL_SEARCH_MAX_LENGTH = 100;

export const trainingModeSchema = z.enum([
  "onsite",
  "hybrid",
  "remote",
  "online",
]);

const courseSkillSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(skillTypes),
});

export const courseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  institution: z.string().nullable(),
  mode: trainingModeSchema.nullable(),
  external_link: z.string(),
  skills: z.array(courseSkillSchema),
});

const courseSearchPageSchema = z.object({
  items: z.array(courseSchema),
  total: z.number().int().nonnegative(),
});

export type TrainingMode = z.infer<typeof trainingModeSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseSearchPage = z.infer<typeof courseSearchPageSchema>;

export async function fetchCourses(
  skill: string,
  signal?: AbortSignal,
): Promise<CourseSearchPage> {
  const trimmed = skill.trim();
  const response = await apiClient.get<unknown>(TRAININGS_ENDPOINT, {
    params: {
      limit: COURSE_PAGE_SIZE,
      offset: 0,
      ...(trimmed === "" ? {} : { skill: trimmed }),
    },
    ...(signal ? { signal } : {}),
  });

  const parsed = courseSearchPageSchema.safeParse(response.data);
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
