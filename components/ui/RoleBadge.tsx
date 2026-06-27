"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { Role } from "@/app/generated/prisma/client";

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { t } = useTranslation();
  const colors: Record<Role, string> = {
    FAMILY: "bg-khummela-hope/10 text-khummela-hope",
    VOLUNTEER: "bg-black/[0.04] text-khummela-muted",
    SUPERVISOR: "bg-khummela-primary/10 text-khummela-primary",
    POLICE: "bg-khummela-error/10 text-khummela-error",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        colors[role],
        className
      )}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
