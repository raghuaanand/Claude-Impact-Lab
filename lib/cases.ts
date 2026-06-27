import { prisma } from "@/lib/prisma";
import type { CaseType } from "@/app/generated/prisma/client";

/** Next case ref for the current year (e.g. SC-M-2026-2519). Uses max existing suffix, not row count. */
export async function generateCaseRef(type: CaseType): Promise<string> {
  const prefix = type === "MISSING" ? "SC-M" : "SC-F";
  const year = new Date().getFullYear();
  const refPrefix = `${prefix}-${year}-`;

  const latest = await prisma.case.findFirst({
    where: { caseRef: { startsWith: refPrefix } },
    orderBy: { caseRef: "desc" },
    select: { caseRef: true },
  });

  let nextNum = 1;
  if (latest?.caseRef.startsWith(refPrefix)) {
    const parsed = parseInt(latest.caseRef.slice(refPrefix.length), 10);
    if (!Number.isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }

  return `${refPrefix}${String(nextNum).padStart(4, "0")}`;
}

export function mapCsvStatus(status: string): "OPEN" | "RESOLVED" | "TRANSFERRED" | "UNRESOLVED" {
  switch (status) {
    case "Reunited":
      return "RESOLVED";
    case "Pending":
      return "OPEN";
    case "Transferred to hospital":
      return "TRANSFERRED";
    case "Unresolved":
      return "UNRESOLVED";
    default:
      return "OPEN";
  }
}

export function mapMelaCategory(category: string) {
  const map: Record<string, "TRAFFIC_CHOKE" | "NO_VEHICLE_ZONE" | "TRANSFER_NODE" | "PARKING" | "OUTER_PARKING" | "PARKING_BELT"> = {
    "Traffic choke point": "TRAFFIC_CHOKE",
    "No-vehicle pressure zone": "NO_VEHICLE_ZONE",
    "Transfer node": "TRANSFER_NODE",
    Parking: "PARKING",
    "Outer parking": "OUTER_PARKING",
    "Parking belt": "PARKING_BELT",
  };
  return map[category] ?? "PARKING";
}
