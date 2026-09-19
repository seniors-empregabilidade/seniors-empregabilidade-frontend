import { z } from "zod";

export const searchSchema = z.object({
  search: z
    .string()
    .max(50, { message: "O nome da empresa deve ter no máximo 50 caracteres." })
    .optional(),
});

export type SearchForm = z.infer<typeof searchSchema>;

export type ApplicationStatus = "ANALYSIS" | "CLOSED";

export interface Application {
  id: string;
  company: string;
  companyInitials: string;
  role: string;
  appliedDate: string;
  daysInProcess?: number;
  status: ApplicationStatus;
  expectedResponseDays?: number;
  closedDate?: string;
  closedReason?: string;
  similarJobs?: number;
}

export const mockApplications: Application[] = [
  {
    id: "1",
    company: "LogiBrás",
    companyInitials: "LB",
    role: "Analista Administrativo",
    appliedDate: "4 de agosto",
    daysInProcess: 15,
    status: "ANALYSIS",
    expectedResponseDays: 20,
  },
  {
    id: "2",
    company: "TechCorp",
    companyInitials: "TC",
    role: "Gerente de Operações",
    appliedDate: "28 de julho",
    daysInProcess: 22,
    status: "ANALYSIS",
    expectedResponseDays: 30,
  },
  {
    id: "3",
    company: "Vitalis",
    companyInitials: "VT",
    role: "Coordenador de Projetos",
    appliedDate: "22 de julho",
    closedDate: "12 de agosto",
    status: "CLOSED",
    closedReason:
      "A empresa seguiu com alguém que já atuava no setor de saúde.",
    similarJobs: 3,
  },
];

export const fetchApplications = async (): Promise<Application[]> => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockApplications), 800),
  );
};
