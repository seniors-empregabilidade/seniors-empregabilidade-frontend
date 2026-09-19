/**
 * Lê ano/mês/dia direto do texto "YYYY-MM-DD", sem passar por `new Date()`.
 * `new Date("YYYY-MM-DD")` interpreta a data como UTC-0, o que no fuso do
 * Brasil (UTC-3) faz o dia "virar" para o anterior — por isso não usamos
 * o construtor de Date para parsear datas vindas da API.
 */
function parseIsoDate(isoDate: string): {
  year: number;
  month: number; // 0-indexed, como Date.prototype.getMonth()
  day: number;
} {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year: year!, month: month! - 1, day: day! };
}

export function getYear(isoDate: string): number {
  return parseIsoDate(isoDate).year;
}

export function calculateAge(birthDate: string): number {
  const { year, month, day } = parseIsoDate(birthDate);
  const today = new Date();

  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() > month ||
    (today.getMonth() === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function formatExperiencePeriod(
  startDate: string,
  endDate: string | null,
): { label: string; duration: string } {
  const start = parseIsoDate(startDate);
  const end = endDate
    ? parseIsoDate(endDate)
    : { year: new Date().getFullYear(), month: new Date().getMonth(), day: 1 };

  const totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
  const years = Math.floor(totalMonths / 12);

  return {
    label: `${start.year} – ${endDate ? end.year : "atual"}`,
    duration:
      years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "menos de 1 ano",
  };
}
