import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-khummela-surface", className)}
    />
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <Skeleton className="h-16 w-16 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
