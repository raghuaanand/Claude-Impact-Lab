import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.zone.findMany({
    include: {
      _count: { select: { cases: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({
    zones: zones.map((z) => ({
      id: z.id,
      code: z.code,
      name: z.name,
      centroidLat: z.centroidLat,
      centroidLng: z.centroidLng,
      caseCount: z._count.cases,
    })),
  });
}
