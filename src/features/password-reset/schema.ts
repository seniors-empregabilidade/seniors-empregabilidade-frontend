import { z } from "zod";

export const passwordResetRequestSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export type PasswordResetRequestValues = z.infer<
  typeof passwordResetRequestSchema
>;

// Mirrors the Cognito user pool policy configured in infra/cognito/user-pool.json.
// The pool stays authoritative: it answers password_policy_violation when a
// password reaches it that these rules would have let through.
export const passwordRules = [
  {
    id: "minLength",
    text: "Pelo menos 8 caracteres",
    isMet: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    text: "Pelo menos uma letra maiúscula",
    isMet: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    text: "Pelo menos uma letra minúscula",
    isMet: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    text: "Pelo menos um número",
    isMet: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "special",
    text: "Pelo menos um caractere especial",
    isMet: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export const passwordResetConfirmationSchema = z
  .object({
    email: z.email("Informe um e-mail válido."),
    code: z.string().min(1, "Informe o código recebido por e-mail."),
    password: z
      .string()
      .refine(
        (password) => passwordRules.every((rule) => rule.isMet(password)),
        "A senha não atende aos requisitos abaixo.",
      ),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type PasswordResetConfirmationValues = z.infer<
  typeof passwordResetConfirmationSchema
>;
