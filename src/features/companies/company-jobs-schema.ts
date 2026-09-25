import { z } from "zod";

// Espelha o JobResponse do backend (app/jobs/schemas/job.py). A listagem da
// US-18-T01 ainda não existe: os campos abaixo são os que o backend já
// devolve hoje na criação da vaga.
export const companyJobStatusSchema = z.enum([
  "draft",
  "under_review",
  "published",
  "paused",
  "expired",
]);

export const companyJobSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  work_mode: z.enum(["onsite", "hybrid", "remote"]),
  closing_date: z.string(),
  status: companyJobStatusSchema,
});

export const companyJobsSchema = z.array(companyJobSchema);

export type CompanyJob = z.infer<typeof companyJobSchema>;
export type CompanyJobStatus = z.infer<typeof companyJobStatusSchema>;

export const OPEN_STATUS = "published" satisfies CompanyJobStatus;

// "Encerrada" não existe no enum do backend. Enquanto a US-18-T01 não
// definir o valor, encerrar usa `paused`, que é o único estado existente que
// tira a vaga das buscas sem apagá-la.
export const CLOSED_STATUS = "paused" satisfies CompanyJobStatus;

export function isOpen(job: CompanyJob): boolean {
  return job.status === OPEN_STATUS;
}
