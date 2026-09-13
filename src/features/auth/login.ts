import { apiClient } from "@/lib/api-client";

import { type LoginFormValues, type Session, sessionSchema } from "./schema";

export async function login(credentials: LoginFormValues): Promise<Session> {
  const response = await apiClient.post<unknown>("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });

  // The tokens are only useful if the contract really matches; a partial payload
  // must fail here rather than halfway through a protected route.
  return sessionSchema.parse(response.data);
}
