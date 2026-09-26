import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import { professionalProfileQueryKey } from "./professional-profile";
import {
  professionalProfileSchema,
  type ProfessionalProfile,
} from "./professional-profile-schema";
import type { ProfessionalProfileUpdateValues } from "./professional-profile-update-schema";

const PROFILE_ENDPOINT = "/professionals/me";

export async function updateProfessionalProfile(
  values: ProfessionalProfileUpdateValues,
): Promise<ProfessionalProfile> {
  const response = await apiClient.patch<unknown>(PROFILE_ENDPOINT, values);

  const parsed = professionalProfileSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError({
      message: "Não foi possível validar a resposta da atualização.",
      code: "invalid_profile_response",
    });
  }

  return parsed.data;
}

export { professionalProfileQueryKey };
