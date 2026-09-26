import { z } from "zod";

const required = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Preencha este campo.")
    .max(max, `Use até ${max} caracteres.`);

export const jobPostingSchema = z.object({
  title: required(150),
  description: required(5000),
  skills: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Adicione pelo menos uma habilidade."),
});

export type JobPostingValues = z.infer<typeof jobPostingSchema>;
