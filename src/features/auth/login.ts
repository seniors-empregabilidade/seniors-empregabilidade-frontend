import { ApiError } from "@/lib/api-error";

import {
  type LoginFormValues,
  type Session,
  type UserType,
  sessionSchema,
} from "./schema";

// Temporary mock until Cognito-backed POST /auth/login is available to the frontend.
// Keep the Session shape identical to the API contract so the swap is localized here.
const MOCK_NETWORK_DELAY_MS = import.meta.env.MODE === "test" ? 0 : 600;

export async function login(credentials: LoginFormValues): Promise<Session> {
  await wait(MOCK_NETWORK_DELAY_MS);

  if (credentials.password === "incorreta") {
    throw new ApiError({
      message: "E-mail ou senha incorretos",
      status: 401,
      code: "invalid_credentials",
    });
  }

  const fieldErrors = mockFieldErrors(credentials.email);

  if (fieldErrors) {
    throw new ApiError({
      message: "Revise os campos informados.",
      status: 422,
      errors: fieldErrors,
    });
  }

  return sessionSchema.parse({
    access_token: "mock-access-token",
    id_token: "mock-id-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
    user_id: "11111111-1111-4111-8111-111111111111",
    user_type: mockUserType(credentials.email),
  });
}

function mockUserType(email: string): UserType {
  if (email.startsWith("admin@")) {
    return "administrator";
  }

  if (email.startsWith("empresa@")) {
    return "company";
  }

  return "candidate";
}

function mockFieldErrors(email: string): Record<string, string[]> | undefined {
  if (email === "invalido@exemplo.com") {
    return { email: ["E-mail inválido"] };
  }

  return undefined;
}

function wait(durationMs: number) {
  if (durationMs === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
