import { z } from "zod";

// Mirrors the backend catalog: a name is compared after its normalized form is
// capped at 100 characters, and a job accepts at most 100 skills.
export const MAX_SKILL_NAME_LENGTH = 100;
const MAX_SKILLS = 100;

export const workModes = ["onsite", "hybrid", "remote"] as const;
export const workModeSchema = z.enum(workModes);
export type WorkMode = z.infer<typeof workModeSchema>;

export const skillTypes = ["hard", "soft"] as const;
export const skillTypeSchema = z.enum(skillTypes);
export type SkillType = z.infer<typeof skillTypeSchema>;

const required = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Preencha este campo.")
    .max(max, `Use até ${max} caracteres.`);

export const jobSkillSchema = z.object({
  name: z.string().trim().min(1).max(MAX_SKILL_NAME_LENGTH),
  type: skillTypeSchema,
});

export type JobSkill = z.infer<typeof jobSkillSchema>;

export const jobPostingSchema = z.object({
  title: required(150),
  description: required(5000),
  workMode: z.enum(workModes, { error: "Escolha a modalidade de trabalho." }),
  closingDate: z
    .string()
    .min(1, { error: "Informe a data de encerramento.", abort: true })
    .refine(
      (value) => value >= todayIsoDate(),
      "A data de encerramento não pode estar no passado.",
    ),
  skills: z
    .array(jobSkillSchema)
    .min(1, "Adicione pelo menos uma habilidade.")
    .max(MAX_SKILLS, `Use até ${MAX_SKILLS} habilidades.`),
});

export type JobPostingValues = z.infer<typeof jobPostingSchema>;

/** Today's calendar date where the person is, as `<input type="date">` reads it. */
export function todayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * The form in which the catalog compares two skill names: no case, accents,
 * invisible characters or repeated spaces. "Gestão  de equipes" and
 * "gestao de equipes" are the same skill.
 */
export function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\p{Mn}\p{Sk}\p{Cf}]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}
