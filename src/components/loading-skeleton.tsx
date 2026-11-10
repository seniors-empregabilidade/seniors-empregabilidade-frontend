import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LINE = "h-6 border border-border bg-accent motion-reduce:animate-none";

/**
 * Placeholder lines while a screen or panel loads. The label stays in the
 * status region, so screen readers still hear what is loading. Bordered
 * accent lines stay visible on the muted page background and on cards.
 */
export function LoadingSkeleton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div role="status" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className={cn(LINE, "w-2/3")} />
      <Skeleton className={cn(LINE, "w-full")} />
      <Skeleton className={cn(LINE, "w-1/2")} />
    </div>
  );
}
