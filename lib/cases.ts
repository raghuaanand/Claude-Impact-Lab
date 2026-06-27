import { prisma } from "@/lib/prisma";
import type { CaseType } from "@/app/generated/prisma/client";

let counter = 0;

export async function generateCaseRef(type: CaseType): Promise<string> {
  const prefix = type === "MISSING" ? "SC-M" : "SC-F";
  const year = new Date().getFullYear();
  const count = await prisma.case.count({ where: { type } });
  counter += 1;
  const num = String(count + counter).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
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
