import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupervisor } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireSupervisor();
  if ("error" in authResult) return authResult.error;

  const [activeMissing, foundOpen, resolved, duplicates, avgResolution] = await Promise.all([
    prisma.case.count({ where: { type: "MISSING", status: { in: ["OPEN", "MATCH_PENDING"] } } }),
    prisma.case.count({ where: { type: "FOUND", status: { in: ["OPEN", "MATCH_PENDING"] } } }),
    prisma.case.count({ where: { status: "RESOLVED" } }),
    prisma.case.count({ where: { isDuplicate: true } }),
    prisma.case.aggregate({
      where: { resolutionHours: { not: null } },
      _avg: { resolutionHours: true },
    }),
  ]);

  const byZone = await prisma.zone.findMany({
    include: {
      _count: { select: { cases: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    activeMissing,
    foundOpen,
    resolved,
    duplicates,
    avgResolutionHours: avgResolution._avg.resolutionHours ?? 0,
    byZone: byZone.map((z) => ({
      id: z.id,
      code: z.code,
      name: z.name,
      count: z._count.cases,
    })),
  });
}
