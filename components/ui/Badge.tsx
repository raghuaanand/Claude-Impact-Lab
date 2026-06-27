import { cn } from "@/lib/utils";

const variants = {
  OPEN: "bg-khummela-accent/10 text-khummela-accent",
  MATCH_PENDING: "bg-khummela-primary/10 text-khummela-primary",
  RESOLVED: "bg-khummela-success/10 text-khummela-success",
  TRANSFERRED: "bg-khummela-hope/15 text-khummela-hope",
  UNRESOLVED: "bg-khummela-muted/15 text-khummela-muted",
  DUPLICATE: "bg-khummela-muted/15 text-khummela-text",
  SUGGESTED: "bg-khummela-accent/10 text-khummela-accent",
  APPROVED: "bg-khummela-success/10 text-khummela-success",
  REJECTED: "bg-khummela-error/10 text-khummela-error",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status] ?? variants.OPEN,
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
