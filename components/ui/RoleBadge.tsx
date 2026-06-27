import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/roles";
import type { Role } from "@/app/generated/prisma/client";

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const colors: Record<Role, string> = {
    FAMILY: "bg-khummela-hope/15 text-khummela-primary",
    VOLUNTEER: "bg-khummela-accent/10 text-khummela-accent",
    SUPERVISOR: "bg-khummela-primary/10 text-khummela-primary",
    POLICE: "bg-khummela-error/10 text-khummela-error",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[role],
        className
      )}
    >
      {roleLabel(role)}
    </span>
  );
}
