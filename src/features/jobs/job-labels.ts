import type { WorkMode } from "./job-posting-schema";

export const workModeLabels: Record<WorkMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
};

/** "2026-12-31" → "31/12/2026", without a time zone shifting the day. */
export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
