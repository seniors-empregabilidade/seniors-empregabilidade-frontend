// Job statuses of the backend (JobStatus in app/db/models/enums.py), shared by
// the company's job screens and the administrator's course editor.
export const jobStatuses = [
  "draft",
  "under_review",
  "published",
  "paused",
  "expired",
  "closed",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: "Rascunho",
  under_review: "Em análise",
  published: "Aberta",
  paused: "Pausada",
  expired: "Expirada",
  closed: "Encerrada",
};
