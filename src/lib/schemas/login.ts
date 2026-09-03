import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const sessionSchema = z.object({
  role: z.enum(["candidato", "empresa"]),
});

export type Session = z.infer<typeof sessionSchema>;
