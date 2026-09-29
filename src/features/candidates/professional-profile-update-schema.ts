import { z } from "zod";

// Espelha TrimmedName/TrimmedPhone/TrimmedCity/TrimmedState do backend
// (ProfessionalProfileUpdateRequest, schemas.py).
export const professionalProfileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Informe seu nome completo.")
    .max(150, "O nome pode ter no máximo 150 caracteres."),
  phone: z
    .string()
    .trim()
    .min(7, "Informe um telefone válido.")
    .max(20, "O telefone pode ter no máximo 20 caracteres."),
  city: z
    .string()
    .trim()
    .min(1, "Informe sua cidade.")
    .max(100, "A cidade pode ter no máximo 100 caracteres."),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado, com 2 letras (ex: SP).")
    .transform((value) => value.toUpperCase()),
  summary: z.string().trim(),
});

export type ProfessionalProfileUpdateValues = z.infer<
  typeof professionalProfileUpdateSchema
>;
