import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .email("Informe um e-mail válido, como pessoa@exemplo.com.")
  .max(150, "O e-mail deve ter no máximo 150 caracteres.");

export const verificationSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .min(1, "Informe o código recebido por e-mail.")
    .max(2048, "Confira o código recebido por e-mail."),
});

export type VerificationValues = z.infer<typeof verificationSchema>;

export const emailRequestSchema = verificationSchema.pick({ email: true });
export const codeRequestSchema = verificationSchema.pick({ code: true });

export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  const suffix = domain.lastIndexOf(".");
  return `${name.slice(0, 1)}***@${domain.slice(0, 1)}***${suffix >= 0 ? domain.slice(suffix) : ""}`;
}

export async function confirmEmail(
  values: VerificationValues,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.post(
    "/email-verification/confirm",
    {
      email: values.email,
      code: values.code,
    },
    signal ? { signal } : {},
  );
}

export async function sendVerificationEmail(
  email: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.post(
    "/email-verification/send",
    { email },
    signal ? { signal } : {},
  );
}

export function verificationError(error: unknown): {
  message: string;
  fields?: Array<"email" | "code">;
} {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "invalid_verification_code":
        return {
          message:
            "O código está incorreto ou expirou. Confira o e-mail recebido ou peça um novo código.",
          fields: ["code"],
        };
      case "too_many_attempts":
        return {
          message:
            "Foram feitas muitas tentativas. Aguarde antes de tentar novamente.",
        };
      case "identity_provider_unavailable":
        return {
          message:
            "O serviço de verificação está indisponível. Tente novamente mais tarde.",
        };
      case "validation_error":
        return {
          message:
            "Não foi possível validar o pedido. Confira o e-mail e o código informados.",
          fields: (["email", "code"] as const).filter(
            (field) =>
              Object.hasOwn(error.errors ?? {}, field) ||
              Object.hasOwn(error.errors ?? {}, `body.${field}`),
          ),
        };
    }
  }
  return {
    message:
      "Não foi possível concluir a verificação. Confira sua conexão e tente novamente.",
  };
}
