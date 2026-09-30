import { z } from "zod";

export const jobVacancyWorkModeSchema = z.enum(["onsite", "remote", "hybrid"]);

export const jobVacancyStatusSchema = z.enum(["open", "closed"]);

export const jobVacancySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  company_name: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  work_mode: jobVacancyWorkModeSchema,
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  published_at: z.string(),
  status: jobVacancyStatusSchema,
  has_applied: z.boolean(),
  skills: z.array(z.string()),
});

export const jobApplicationSchema = z.object({
  id: z.uuid(),
});

export type JobVacancyWorkMode = z.infer<typeof jobVacancyWorkModeSchema>;
export type JobVacancyStatus = z.infer<typeof jobVacancyStatusSchema>;
export type JobVacancy = z.infer<typeof jobVacancySchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
