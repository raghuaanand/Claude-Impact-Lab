import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireSupervisor } from "@/lib/api-auth";
import { dispatchCctvAlertsForCase } from "@/lib/cctv-dispatch";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const caseRecord = await prisma.case.findUnique({
    where: { id },
    select: { id: true, type: true },
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const alerts = await prisma.cctvAlert.findMany({
    where: { caseId: id },
    include: {
      cctvLocation: {
        select: { cameraId: true, lat: true, lng: true, zone: { select: { code: true, name: true } } },
      },
    },
    orderBy: { distanceMeters: "asc" },
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      cameraId: a.cctvLocation.cameraId,
      zoneCode: a.cctvLocation.zone.code,
      zoneName: a.cctvLocation.zone.name,
      lat: a.cctvLocation.lat,
      lng: a.cctvLocation.lng,
      distanceMeters: Math.round(a.distanceMeters),
      status: a.status,
      sentAt: a.sentAt,
      createdAt: a.createdAt,
    })),
    total: alerts.length,
  });
}

export async function POST(_req: NextRequest, { params }: Params) {
  const authResult = await requireSupervisor();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await dispatchCctvAlertsForCase(id);

  if (result.skipped && result.alerted === 0) {
    return NextResponse.json(
      { error: result.reason ?? "Could not dispatch alerts", ...result },
      { status: result.reason === "Case not found" ? 404 : 400 }
    );
  }

  return NextResponse.json(result);
}
