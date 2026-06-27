import type { Messages } from "./messages";
import type { TranslateFn } from "./translate";

type BadgeStatus = keyof Messages["badge"];

export function statusLabel(t: TranslateFn, status: string): string {
  const key = `badge.${status}` as `badge.${BadgeStatus}`;
  const labels = {
    OPEN: t("badge.OPEN"),
    MATCH_PENDING: t("badge.MATCH_PENDING"),
    RESOLVED: t("badge.RESOLVED"),
    TRANSFERRED: t("badge.TRANSFERRED"),
    UNRESOLVED: t("badge.UNRESOLVED"),
    DUPLICATE: t("badge.DUPLICATE"),
    SUGGESTED: t("badge.SUGGESTED"),
    APPROVED: t("badge.APPROVED"),
    REJECTED: t("badge.REJECTED"),
    PENDING: t("badge.PENDING"),
    SENT: t("badge.SENT"),
    ACKNOWLEDGED: t("badge.ACKNOWLEDGED"),
    REVIEWED: t("badge.REVIEWED"),
  } as Record<string, string>;
  return labels[status] ?? status.replace(/_/g, " ");
}
