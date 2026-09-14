import { apiClient } from "@/lib/api-client";

import type {
  PasswordResetConfirmationValues,
  PasswordResetRequestValues,
} from "./schema";

/**
 * The API answers 202 for every address, so a resolved promise never means the
 * address belongs to an account. Do not tell the user it does.
 */
export async function requestPasswordReset(
  values: PasswordResetRequestValues,
): Promise<void> {
  await apiClient.post("/password-reset/send", { email: values.email });
}

export async function confirmPasswordReset(
  values: PasswordResetConfirmationValues,
): Promise<void> {
  await apiClient.post("/password-reset/confirm", {
    email: values.email,
    code: values.code,
    password: values.password,
  });
}
