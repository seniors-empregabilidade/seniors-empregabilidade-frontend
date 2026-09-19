import { ApiError } from "@/lib/api-error";

const GENERIC_ERROR =
  "Não foi possível concluir a operação. Tente novamente em instantes.";

export const INVALID_CODE_ERROR =
  "Código inválido ou expirado. Solicite um novo código.";

const MESSAGES_BY_CODE: Record<string, string> = {
  invalid_verification_code: INVALID_CODE_ERROR,
  password_policy_violation: "A senha não atende aos requisitos de segurança.",
  too_many_attempts:
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  identity_provider_unavailable:
    "Serviço temporariamente indisponível. Tente novamente em instantes.",
};

/**
 * The API details are English operator text, so they are mapped to the
 * Brazilian Portuguese the user reads. An unmapped failure stays generic
 * rather than leaking a provider message.
 */
export function messageForApiError(error: unknown): string {
  if (!(error instanceof ApiError) || !error.code) {
    return GENERIC_ERROR;
  }

  return MESSAGES_BY_CODE[error.code] ?? GENERIC_ERROR;
}

export function isInvalidCodeError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === "invalid_verification_code"
  );
}

export function isPasswordRejectedError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === "password_policy_violation"
  );
}
