import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const userTypeSchema = z.enum(["candidate", "company", "administrator"]);

export type UserType = z.infer<typeof userTypeSchema>;

export const sessionSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().min(1),
  refresh_token: z.string().min(1).nullable(),
  expires_in: z.number().int().positive(),
  token_type: z.string().min(1),
  user_id: z.uuid(),
  user_type: userTypeSchema,
});

export type Session = z.infer<typeof sessionSchema>;

export const companyStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "blocked",
]);

export type CompanyStatus = z.infer<typeof companyStatusSchema>;

// GET /auth/me. The role is read from the database on every request, so this is
// the authority on what the signed-in account may reach, never the login payload.
export const currentUserSchema = z.object({
  id: z.uuid(),
  user_type: userTypeSchema,
  company_status: companyStatusSchema.nullable().default(null),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
