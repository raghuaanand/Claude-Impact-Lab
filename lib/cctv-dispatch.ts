import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildCctvAlertMessage,
  findNearbyCctv,
  type NearbyCctv,
} from "@/lib/cctv";

function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

type DispatchResult = {
  alerted: number;
  cameras: { cameraId: string; distanceMeters: number; status: string }[];
  skipped: boolean;
  reason?: string;
};

/**
 * Push an alert to a CCTV control endpoint.
 * Set CCTV_ALERT_WEBHOOK_URL for production integration; logs in development.
 */
async function sendToCctvEndpoint(
  cameraId: string,
  message: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.CCTV_ALERT_WEBHOOK_URL;

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cameraId, message, ...payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CCTV webhook failed for ${cameraId}: ${errorText}`);
    }
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[KHUMMELA CCTV] No CCTV_ALERT_WEBHOOK_URL — alert queued for ${cameraId}`
    );
    return;
  }

  console.log(`[KHUMMELA CCTV DEV] Camera: ${cameraId} | ${message}`);
}

export async function dispatchCctvAlertsForCase(caseId: string): Promise<DispatchResult> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      zone: { select: { name: true, code: true } },
      media: { select: { cdnUrl: true }, take: 1 },
    },
  });

  if (!caseRecord) {
    return { alerted: 0, cameras: [], skipped: true, reason: "Case not found" };
  }

  if (caseRecord.type !== "MISSING") {
    return {
      alerted: 0,
      cameras: [],
      skipped: true,
      reason: "CCTV alerts only apply to missing person cases",
    };
  }

  if (!caseRecord.zoneId) {
    return {
      alerted: 0,
      cameras: [],
      skipped: true,
      reason: "No last-seen zone on case",
    };
  }

  if (caseRecord.status === "DUPLICATE") {
    return {
      alerted: 0,
      cameras: [],
      skipped: true,
      reason: "Duplicate case — alerts not sent",
    };
  }

  const nearby = await findNearbyCctv(caseRecord.zoneId);
  if (nearby.length === 0) {
    return {
      alerted: 0,
      cameras: [],
      skipped: true,
      reason: "No CCTV cameras near last-seen area",
    };
  }

  let alreadyAlerted = new Set<string>();

  try {
    const existing = await prisma.cctvAlert.findMany({
      where: { caseId },
      select: { cctvLocationId: true },
    });
    alreadyAlerted = new Set(existing.map((a) => a.cctvLocationId));
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn(
        "[KHUMMELA CCTV] CctvAlert table missing — run: npm run db:migrate"
      );
      return {
        alerted: 0,
        cameras: [],
        skipped: true,
        reason: "CCTV alerts not configured (database migration pending)",
      };
    }
    throw error;
  }

  const toAlert = nearby.filter((cam) => !alreadyAlerted.has(cam.id));

  const results: DispatchResult["cameras"] = [];

  for (const cam of toAlert) {
    const message = buildCctvAlertMessage(caseRecord, cam.cameraId);
    const alert = await prisma.cctvAlert.create({
      data: {
        caseId,
        cctvLocationId: cam.id,
        distanceMeters: cam.distanceMeters,
        message,
        status: "PENDING",
      },
    });

    try {
      await sendToCctvEndpoint(cam.cameraId, message, {
        caseRef: caseRecord.caseRef,
        caseId: caseRecord.id,
        lat: cam.lat,
        lng: cam.lng,
        zoneCode: cam.zoneCode,
        distanceMeters: cam.distanceMeters,
      });

      await prisma.cctvAlert.update({
        where: { id: alert.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      results.push({
        cameraId: cam.cameraId,
        distanceMeters: cam.distanceMeters,
        status: "SENT",
      });
    } catch {
      await prisma.cctvAlert.update({
        where: { id: alert.id },
        data: { status: "PENDING" },
      });

      results.push({
        cameraId: cam.cameraId,
        distanceMeters: cam.distanceMeters,
        status: "PENDING",
      });
    }
  }

  return { alerted: results.length, cameras: results, skipped: false };
}

export function formatCctvAlertSummary(cameras: NearbyCctv[]): string {
  if (cameras.length === 0) return "No nearby cameras";
  const zones = [...new Set(cameras.map((c) => c.zoneCode))];
  return `${cameras.length} camera(s) in ${zones.join(", ")}`;
}
