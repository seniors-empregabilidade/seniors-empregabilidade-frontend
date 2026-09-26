export function CompanyBadge({ companyName }: { companyName: string }) {
  const initials = companyName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-semibold text-foreground-2"
    >
      {initials || "—"}
    </div>
  );
}
