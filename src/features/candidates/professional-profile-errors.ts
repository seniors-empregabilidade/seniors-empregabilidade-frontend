import { ApiError } from "@/lib/api-error";

const GENERIC_PROFILE_ERROR =
  "Não foi possível carregar seu perfil. Tente novamente.";

const messages: Record<string, string> = {
  profile_not_found: "Não encontramos seu perfil de candidato.",
};

/**
 * The API's `detail` is English operator text (problem+json), so it is
 * mapped by `code` to the Brazilian Portuguese the user reads. An unmapped
 * failure — including network errors and our own schema-mismatch error —
 * stays generic rather than leaking a provider message.
 */
export function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code) {
    return messages[error.code] ?? GENERIC_PROFILE_ERROR;
  }

  return GENERIC_PROFILE_ERROR;
}
