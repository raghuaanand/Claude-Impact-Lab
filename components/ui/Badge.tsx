import { cn } from "@/lib/utils";

const variants = {
  OPEN: "bg-blue-500/[0.08] text-blue-600 border border-blue-500/10",
  MATCH_PENDING: "bg-amber-500/[0.08] text-amber-600 border border-amber-500/10",
  RESOLVED: "bg-emerald-500/[0.08] text-emerald-600 border border-emerald-500/10",
  TRANSFERRED: "bg-purple-500/[0.08] text-purple-600 border border-purple-500/10",
  UNRESOLVED: "bg-zinc-500/[0.08] text-zinc-600 border border-zinc-500/10",
  DUPLICATE: "bg-amber-500/[0.08] text-amber-600 border border-amber-500/10",
  SUGGESTED: "bg-blue-500/[0.08] text-blue-600 border border-blue-500/10",
  APPROVED: "bg-emerald-500/[0.08] text-emerald-600 border border-emerald-500/10",
  REJECTED: "bg-rose-500/[0.08] text-rose-600 border border-rose-500/10",
};

type BadgeProps = {
  status: keyof typeof variants;
  label?: string;
  className?: string;
};

export function Badge({ status, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
        variants[status] ?? variants.OPEN,
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

