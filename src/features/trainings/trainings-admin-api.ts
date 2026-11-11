import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { jobStatuses } from "@/lib/job-status-labels";
import { skillTypes } from "@/lib/skill-type";

import { trainingModeSchema, type TrainingMode } from "./trainings-api";

// US-22-T03 consumes the administrator endpoints of US-22-T01. A course is
// "inactive" when it is not published: candidates stop seeing it, but the
// course and its relations stay and can be published again. US-22-T04 adds
// the related jobs, picked from GET /admin/jobs.
const TRAININGS_ENDPOINT = "/admin/trainings";
const SKILL_OPTIONS_ENDPOINT = "/skills";
const JOB_OPTIONS_ENDPOINT = "/admin/jobs";

export const TRAININGS_PAGE_SIZE = 20;
// Mirror the backend limits of a course.
export const TRAINING_TITLE_MAX_LENGTH = 150;
export const TRAINING_INSTITUTION_MAX_LENGTH = 150;
export const TRAINING_LINK_MAX_LENGTH = 2048;
export const TRAINING_MAX_SKILLS = 50;
export const TRAINING_MAX_JOBS = 50;
export const SKILL_OPTIONS_LIMIT = 20;
export const SKILL_SEARCH_MAX_LENGTH = 100;
export const JOB_OPTIONS_LIMIT = 20;
export const JOB_SEARCH_MAX_LENGTH = 150;

export const trainingModes = ["onsite", "hybrid", "remote", "online"] as const;

export const trainingModeLabels: Record<TrainingMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
  online: "Online",
};

const trainingSkillSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(skillTypes),
});

const trainingJobSchema = z.object({
  id: z.uuid(),
  title: z.string(),
});

// `jobs` is required on purpose: saving sends the jobs shown in the editor as
// the complete set, so a response without them must fail instead of opening
// the editor with an empty list that would erase the stored relations.
const adminTrainingSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  institution: z.string().nullable(),
  mode: trainingModeSchema.nullable(),
  external_link: z.string(),
  published: z.boolean(),
  skills: z.array(trainingSkillSchema),
  job_ids: z.array(z.uuid()),
  jobs: z.array(trainingJobSchema),
});

const adminTrainingListSchema = z.object({
  items: z.array(adminTrainingSchema),
  total: z.number().int().nonnegative(),
});

const skillOptionListSchema = z.array(trainingSkillSchema);

const jobOptionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  company_name: z.string(),
  status: z.enum(jobStatuses),
});

const jobOptionListSchema = z.object({
  items: z.array(jobOptionSchema),
  total: z.number().int().nonnegative(),
});

export type TrainingSkill = z.infer<typeof trainingSkillSchema>;
export type TrainingJob = z.infer<typeof trainingJobSchema>;
export type JobOption = z.infer<typeof jobOptionSchema>;
export type JobOptionList = z.infer<typeof jobOptionListSchema>;
export type AdminTraining = z.infer<typeof adminTrainingSchema>;
export type AdminTrainingList = z.infer<typeof adminTrainingListSchema>;
export type PublishedFilter = "all" | "published" | "unpublished";

export interface TrainingFilters {
  search: string;
  published: PublishedFilter;
  offset: number;
}

export const defaultTrainingFilters: TrainingFilters = {
  search: "",
  published: "all",
  offset: 0,
};

export function trainingsSearchParams(filters: TrainingFilters): string {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search !== "") params.set("search", search);
  if (filters.published !== "all") {
    params.set("published", String(filters.published === "published"));
  }
  params.set("limit", String(TRAININGS_PAGE_SIZE));
  params.set("offset", String(filters.offset));
  return params.toString();
}

function parseTraining(data: unknown): AdminTraining {
  const parsed = adminTrainingSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected training response",
      code: "invalid_training_response",
    });
  }
  return parsed.data;
}

export async function fetchAdminTrainings(
  filters: TrainingFilters,
  signal?: AbortSignal,
): Promise<AdminTrainingList> {
  const response = await apiClient.get<unknown>(
    `${TRAININGS_ENDPOINT}?${trainingsSearchParams(filters)}`,
    signal ? { signal } : undefined,
  );
  const parsed = adminTrainingListSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected training list response",
      code: "invalid_training_list_response",
    });
  }
  return parsed.data;
}

export const adminTrainingsQueryKey = ["administrator", "trainings"] as const;

export function adminTrainingsQueryOptions(filters: TrainingFilters) {
  return queryOptions({
    queryKey: [...adminTrainingsQueryKey, filters],
    queryFn: ({ signal }) => fetchAdminTrainings(filters, signal),
    retry: false,
    // The table stays on screen while the next search loads.
    placeholderData: keepPreviousData,
  });
}

// Active catalog skills the administrator can relate to a course. The same
// endpoint feeds the suggestions of résumés and jobs, so inactive skills never
// show up here.
export async function fetchSkillOptions(
  search: string,
  signal?: AbortSignal,
): Promise<TrainingSkill[]> {
  const trimmed = search.trim();
  const response = await apiClient.get<unknown>(SKILL_OPTIONS_ENDPOINT, {
    params: {
      limit: SKILL_OPTIONS_LIMIT,
      ...(trimmed === "" ? {} : { search: trimmed }),
    },
    ...(signal ? { signal } : {}),
  });
  const parsed = skillOptionListSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected skill options response",
      code: "invalid_skill_options_response",
    });
  }
  return parsed.data;
}

export function skillOptionsQueryOptions(search: string) {
  return queryOptions({
    queryKey: ["administrator", "training-skill-options", search] as const,
    queryFn: ({ signal }) => fetchSkillOptions(search, signal),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

// Jobs in any status, ordered by title: a course may prepare for a job that is
// still a draft or already closed, so the status is shown, not filtered out.
export async function fetchJobOptions(
  search: string,
  signal?: AbortSignal,
): Promise<JobOptionList> {
  const trimmed = search.trim();
  const response = await apiClient.get<unknown>(JOB_OPTIONS_ENDPOINT, {
    params: {
      limit: JOB_OPTIONS_LIMIT,
      ...(trimmed === "" ? {} : { search: trimmed }),
    },
    ...(signal ? { signal } : {}),
  });
  const parsed = jobOptionListSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected job options response",
      code: "invalid_job_options_response",
    });
  }
  return parsed.data;
}

export function jobOptionsQueryOptions(search: string) {
  return queryOptions({
    queryKey: ["administrator", "training-job-options", search] as const,
    queryFn: ({ signal }) => fetchJobOptions(search, signal),
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export const trainingValuesSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Informe o nome do curso." })
    .max(TRAINING_TITLE_MAX_LENGTH, {
      message: `Use até ${TRAINING_TITLE_MAX_LENGTH} caracteres.`,
    }),
  institution: z
    .string()
    .trim()
    .min(1, { message: "Informe a instituição." })
    .max(TRAINING_INSTITUTION_MAX_LENGTH, {
      message: `Use até ${TRAINING_INSTITUTION_MAX_LENGTH} caracteres.`,
    }),
  mode: z.enum(trainingModes, { error: "Escolha a modalidade do curso." }),
  external_link: z
    .string()
    .trim()
    .min(1, { message: "Informe o link do curso." })
    .max(TRAINING_LINK_MAX_LENGTH, {
      message: `Use até ${TRAINING_LINK_MAX_LENGTH} caracteres.`,
    })
    .refine(isWebLink, {
      message: "Informe um link completo, começando com http:// ou https://.",
    }),
  published: z.boolean(),
  skills: z.array(trainingSkillSchema).max(TRAINING_MAX_SKILLS, {
    message: `Relacione no máximo ${TRAINING_MAX_SKILLS} competências.`,
  }),
  jobs: z.array(trainingJobSchema).max(TRAINING_MAX_JOBS, {
    message: `Relacione no máximo ${TRAINING_MAX_JOBS} vagas.`,
  }),
});

export type TrainingValues = z.infer<typeof trainingValuesSchema>;

function isWebLink(value: string): boolean {
  if (/\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== ""
    );
  } catch {
    return false;
  }
}

// The related skills and jobs travel as the complete sets of ids, which
// replace the relations stored for the course.
function toRequestBody(values: TrainingValues) {
  const { skills, jobs, ...rest } = values;
  return {
    ...rest,
    skill_ids: skills.map((skill) => skill.id),
    job_ids: jobs.map((job) => job.id),
  };
}

export async function createTraining(
  values: TrainingValues,
): Promise<AdminTraining> {
  const response = await apiClient.post<unknown>(
    TRAININGS_ENDPOINT,
    toRequestBody(values),
  );
  return parseTraining(response.data);
}

export async function updateTraining(
  trainingId: string,
  values: TrainingValues,
): Promise<AdminTraining> {
  const response = await apiClient.patch<unknown>(
    `${TRAININGS_ENDPOINT}/${trainingId}`,
    toRequestBody(values),
  );
  return parseTraining(response.data);
}

export async function changeTrainingPublication(
  trainingId: string,
  published: boolean,
): Promise<AdminTraining> {
  const response = await apiClient.patch<unknown>(
    `${TRAININGS_ENDPOINT}/${trainingId}`,
    { published },
  );
  return parseTraining(response.data);
}

function isAdministratorRefusal(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "administrator_required" || error.status === 403)
  );
}

export function trainingsErrorMessage(error: unknown): string {
  if (isAdministratorRefusal(error)) {
    return "Apenas administradores podem consultar os cursos.";
  }
  return "Não foi possível carregar os cursos. Tente novamente.";
}

export function trainingSaveErrorMessage(error: unknown): string {
  if (isAdministratorRefusal(error)) {
    return "Apenas administradores podem alterar os cursos.";
  }
  if (error instanceof ApiError) {
    if (error.code === "training_not_found") {
      return "Este curso não está mais disponível. Atualize a lista.";
    }
    if (error.code === "training_relation_not_found") {
      return missingRelation(error) === "job_ids"
        ? "Alguma vaga escolhida não existe mais. Revise a lista de vagas e tente de novo."
        : "Alguma competência escolhida não existe mais. Revise a lista de competências e tente de novo.";
    }
    if (error.code === "validation_error") {
      return "Revise os campos: algum valor não foi aceito.";
    }
  }
  return "Não foi possível salvar o curso. Os dados foram mantidos; tente novamente.";
}

export function trainingPublicationErrorMessage(
  error: unknown,
  published: boolean,
): string {
  if (isAdministratorRefusal(error)) {
    return "Apenas administradores podem alterar os cursos.";
  }
  if (error instanceof ApiError && error.code === "training_not_found") {
    return "Este curso não está mais disponível. Atualize a lista.";
  }
  return published
    ? "Não foi possível reativar o curso. Tente novamente."
    : "Não foi possível inativar o curso. Tente novamente.";
}

export function skillOptionsErrorMessage(): string {
  return "Não foi possível carregar as competências. Tente novamente.";
}

export function jobOptionsErrorMessage(): string {
  return "Não foi possível carregar as vagas. Tente novamente.";
}

/** Which relation `training_relation_not_found` refers to, from its field. */
export function missingRelation(
  error: unknown,
): "skill_ids" | "job_ids" | null {
  if (
    !(error instanceof ApiError) ||
    error.code !== "training_relation_not_found"
  ) {
    return null;
  }
  return error.errors?.job_ids ? "job_ids" : "skill_ids";
}
