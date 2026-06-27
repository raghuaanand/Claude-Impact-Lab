import { prisma } from "@/lib/prisma";
import type { AuditAction, EntityType } from "@/app/generated/prisma/client";

type AuditParams = {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  missingReportId?: string;
  foundReportId?: string;
  metadata?: Record<string, unknown>;
};

// Fire-and-forget audit write — failures are logged but never propagate to the caller.
export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}
