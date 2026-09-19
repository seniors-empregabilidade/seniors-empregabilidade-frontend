import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

import {
  professionalProfileSchema,
  type ProfessionalProfile,
} from "./professional-profile-schema";

const PROFILE_ENDPOINT = "/professionals/me";

export const professionalProfileQueryKey = [
  "candidates",
  "professional-profile",
] as const;

export async function fetchProfessionalProfile(): Promise<ProfessionalProfile> {
  const response = await apiClient.get<unknown>(PROFILE_ENDPOINT);

  return professionalProfileSchema.parse(response.data);
}

export const professionalProfileQueryOptions = queryOptions({
  queryKey: professionalProfileQueryKey,
  queryFn: fetchProfessionalProfile,
  retry: 1,
});
