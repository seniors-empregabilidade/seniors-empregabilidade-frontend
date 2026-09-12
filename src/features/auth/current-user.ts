import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

import { type CurrentUser, currentUserSchema } from "./schema";

export const currentUserQueryKey = ["auth", "current-user"] as const;

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<unknown>("/auth/me");

  return currentUserSchema.parse(response.data);
}

export const currentUserQueryOptions = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: fetchCurrentUser,
  // A refused session is an answer, not a transient failure: retrying it only
  // delays the redirect to the login screen.
  retry: false,
});
