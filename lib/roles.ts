import type { Role } from "@/app/generated/prisma/client";
import type { Locale } from "@/lib/i18n/config";
import { roleLabelFromMessages } from "@/lib/i18n/translate";

export const SUPERVISOR_ROLES: Role[] = ["SUPERVISOR", "POLICE"];
export const STAFF_ROLES: Role[] = ["VOLUNTEER", "SUPERVISOR", "POLICE"];
export const ALL_ROLES: Role[] = ["FAMILY", "VOLUNTEER", "SUPERVISOR", "POLICE"];

export function isSupervisor(role: Role): boolean {
  return SUPERVISOR_ROLES.includes(role);
}

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function canSeePii(role: Role): boolean {
  return isSupervisor(role);
}

export function roleLabel(role: Role, locale?: Locale): string {
  if (locale) return roleLabelFromMessages(locale, role);
  const labels: Record<Role, string> = {
    FAMILY: "Family",
    VOLUNTEER: "Volunteer",
    SUPERVISOR: "Supervisor",
    POLICE: "Police",
  };
  return labels[role];
}
