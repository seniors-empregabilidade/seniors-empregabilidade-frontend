import type { JobVacancy, JobVacancyWorkMode } from "./job-vacancy-schema";

const workModeLabels: Record<JobVacancyWorkMode, string> = {
  onsite: "Presencial",
  remote: "Remoto",
  hybrid: "Híbrido",
};

export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function formatWorkMode(workMode: JobVacancyWorkMode): string {
  return workModeLabels[workMode];
}

export function formatLocation(
  city: string | null,
  state: string | null,
): string | null {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return null;
}

export function formatSalaryRange(
  salaryMin: number | null,
  salaryMax: number | null,
): string | null {
  if (salaryMin === null && salaryMax === null) return null;

  const formatValue = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  if (salaryMin !== null && salaryMax !== null) {
    return `${formatValue(salaryMin)} a ${formatValue(salaryMax)}`;
  }

  if (salaryMin !== null) return `a partir de ${formatValue(salaryMin)}`;
  return `até ${formatValue(salaryMax!)}`;
}

function parseIsoDate(value: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

export function formatPublishedLabel(
  publishedAt: string,
  now: Date = new Date(),
): string | null {
  const published = parseIsoDate(publishedAt);
  if (!published) return null;

  const publishedUtc = Date.UTC(published.year, published.month, published.day);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((todayUtc - publishedUtc) / 86_400_000);

  if (days <= 0) return "publicada hoje";
  if (days === 1) return "publicada há 1 dia";
  return `publicada há ${days} dias`;
}

export function formatVacancyMeta(vacancy: JobVacancy, now?: Date): string {
  return [
    formatLocation(vacancy.city, vacancy.state),
    formatWorkMode(vacancy.work_mode),
    formatSalaryRange(vacancy.salary_min, vacancy.salary_max),
    formatPublishedLabel(vacancy.published_at, now),
  ]
    .filter(Boolean)
    .join(" · ");
}
