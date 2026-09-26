import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  experienceSchema,
  educationSchema,
  professionalProfileSchema,
  skillSchema,
  type Education,
  type Experience,
  type ProfessionalProfile,
  type Skill,
} from "./professional-profile-schema";

const PROFILE_ENDPOINT = "/professionals/me";

export const professionalProfileQueryKey = [
  "candidates",
  "professional-profile",
] as const;

export async function fetchProfessionalProfile(
  signal?: AbortSignal,
): Promise<ProfessionalProfile> {
  const response = await apiClient.get<unknown>(
    PROFILE_ENDPOINT,
    signal ? { signal } : {},
  );

  const parsed = professionalProfileSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível carregar os dados do seu perfil.",
      code: "invalid_profile_response",
    });
  }

  return parsed.data;
}

export const professionalProfileQueryOptions = queryOptions({
  queryKey: professionalProfileQueryKey,
  queryFn: ({ signal }) => fetchProfessionalProfile(signal),
  // Uma falha aqui normalmente é um problema real de contrato ou de rede;
  // retry especulativo só atrasa o feedback pro usuário (ver AGENTS.md).
  retry: false,
});

// ---------- Experiência ----------
// Espelha ExperienceCreateRequest/ExperienceUpdateRequest do backend
// (app/candidates/schemas/experience.py). O modal sempre reenvia o item
// inteiro ao concluir a edição, então create e update usam o mesmo
// shape — desde que company_name/role/start_date nunca sejam mandados
// como null explícito (o backend rejeita isso).

const experienceText = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(150, "Máximo de 150 caracteres.");

const experienceDescriptionText = z
  .string()
  .trim()
  .max(2000, "Máximo de 2000 caracteres.");

export const experienceValuesSchema = z.object({
  company_name: experienceText,
  role: experienceText,
  start_date: z.string().min(1, "Informe a data de início."),
  end_date: z.string().nullable(),
  description: experienceDescriptionText.nullable(),
});

export type ExperienceValues = z.infer<typeof experienceValuesSchema>;

export async function createExperience(
  values: ExperienceValues,
): Promise<Experience> {
  const response = await apiClient.post<unknown>(
    `${PROFILE_ENDPOINT}/experiences`,
    values,
  );
  const parsed = experienceSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a experiência criada.",
      code: "invalid_experience_response",
    });
  }
  return parsed.data;
}

export async function updateExperienceById(
  id: string,
  values: ExperienceValues,
): Promise<Experience> {
  const response = await apiClient.patch<unknown>(
    `${PROFILE_ENDPOINT}/experiences/${id}`,
    values,
  );
  const parsed = experienceSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a experiência atualizada.",
      code: "invalid_experience_response",
    });
  }
  return parsed.data;
}

export async function deleteExperienceById(id: string): Promise<void> {
  await apiClient.delete(`${PROFILE_ENDPOINT}/experiences/${id}`);
}

// ---------- Formação ----------
// Espelha EducationCreateRequest/EducationUpdateRequest do backend
// (app/candidates/schemas/education.py). Só `institution` é obrigatório
// e não pode ser mandado como null explícito.

const institutionName = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(150, "Máximo de 150 caracteres.");

const educationDetail = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(100, "Máximo de 100 caracteres.");

export const educationValuesSchema = z.object({
  institution: institutionName,
  degree: educationDetail.nullable(),
  field: educationDetail.nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
});

export type EducationValues = z.infer<typeof educationValuesSchema>;

export async function createEducation(
  values: EducationValues,
): Promise<Education> {
  const response = await apiClient.post<unknown>(
    `${PROFILE_ENDPOINT}/education`,
    values,
  );
  const parsed = educationSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a formação criada.",
      code: "invalid_education_response",
    });
  }
  return parsed.data;
}

export async function updateEducationById(
  id: string,
  values: EducationValues,
): Promise<Education> {
  const response = await apiClient.patch<unknown>(
    `${PROFILE_ENDPOINT}/education/${id}`,
    values,
  );
  const parsed = educationSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a formação atualizada.",
      code: "invalid_education_response",
    });
  }
  return parsed.data;
}

export async function deleteEducationById(id: string): Promise<void> {
  await apiClient.delete(`${PROFILE_ENDPOINT}/education/${id}`);
}

// ---------- Habilidades ----------
// The profile links skills from the shared catalog (GET /skills) by id; a
// candidate cannot create a new catalog entry, only pick an existing one.

const SKILL_CATALOG_ENDPOINT = "/skills";
const SKILL_SUGGESTION_LIMIT = 8;

export function skillCatalogQueryKey(search: string) {
  return ["skills", "catalog", search] as const;
}

export async function searchSkillCatalog(
  search: string,
  signal?: AbortSignal,
): Promise<Skill[]> {
  const response = await apiClient.get<unknown>(SKILL_CATALOG_ENDPOINT, {
    params: { search, limit: SKILL_SUGGESTION_LIMIT },
    ...(signal ? { signal } : {}),
  });
  const parsed = z.array(skillSchema).safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível carregar as sugestões de habilidades.",
      code: "invalid_skill_catalog_response",
    });
  }
  return parsed.data;
}

export async function addProfileSkill(skillId: string): Promise<Skill> {
  const response = await apiClient.post<unknown>(`${PROFILE_ENDPOINT}/skills`, {
    skill_id: skillId,
  });
  const parsed = skillSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a habilidade adicionada.",
      code: "invalid_skill_response",
    });
  }
  return parsed.data;
}

export async function removeProfileSkill(skillId: string): Promise<void> {
  await apiClient.delete(`${PROFILE_ENDPOINT}/skills/${skillId}`);
}
