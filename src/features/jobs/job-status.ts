import { jobStatusLabels } from "./job-labels";
import { todayIsoDate } from "./job-posting-schema";
import type { Job } from "./jobs-api";

type JobState = Pick<Job, "status" | "closing_date">;

export type JobStatusAction = "close" | "reopen";

/**
 * Open as the candidate search sees it: published and not past its closing
 * date. A published job past its date is closed to candidates.
 */
export function isOpenToCandidates(
  job: JobState,
  today: string = todayIsoDate(),
): boolean {
  return job.status === "published" && job.closing_date >= today;
}

/**
 * The one status action a job offers, following the transitions of
 * PATCH /jobs/{id}/status (docs/JOBS.md in the backend repository): a draft or
 * a job under review offers none.
 */
export function statusActionFor(
  job: JobState,
  today: string = todayIsoDate(),
): JobStatusAction | null {
  if (job.status === "draft" || job.status === "under_review") return null;
  return isOpenToCandidates(job, today) ? "close" : "reopen";
}

/** Reopening a job past its closing date needs a new one. */
export function needsNewClosingDate(
  job: JobState,
  today: string = todayIsoDate(),
): boolean {
  return job.closing_date < today;
}

export function jobStatusLabel(
  job: JobState,
  today: string = todayIsoDate(),
): string {
  if (job.status === "published" && job.closing_date < today)
    return "Prazo encerrado";
  return jobStatusLabels[job.status];
}

export function applicationCountLabel(count: number): string {
  if (count === 0) return "Nenhuma candidatura ainda";
  return count === 1 ? "1 candidatura" : `${count} candidaturas`;
}
