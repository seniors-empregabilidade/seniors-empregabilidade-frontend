import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholder lines while a screen or panel loads. The label stays in the
 * status region, so screen readers still hear what is loading.
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
      <Skeleton className="h-6 w-2/3 motion-reduce:animate-none" />
      <Skeleton className="h-6 w-full motion-reduce:animate-none" />
      <Skeleton className="h-6 w-1/2 motion-reduce:animate-none" />
    </div>
  );
}
