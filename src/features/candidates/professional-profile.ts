import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import {
  professionalProfileSchema,
  type ProfessionalProfile,
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
