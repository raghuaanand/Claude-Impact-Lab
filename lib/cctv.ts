import { prisma } from "@/lib/prisma";
import type { Case, CaseMedia, Zone } from "@/app/generated/prisma/client";

const EARTH_RADIUS_M = 6_371_000;

/** Default search radius around the last-seen zone centroid (meters). */
export const CCTV_ALERT_RADIUS_METERS = 500;

/** Max cameras to alert per case dispatch. */
export const CCTV_ALERT_LIMIT = 40;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type NearbyCctv = {
  id: string;
  cameraId: string;
  lat: number;
  lng: number;
  zoneId: string;
  zoneCode: string;
  distanceMeters: number;
};

export async function findNearbyCctv(
  zoneId: string,
  radiusMeters = CCTV_ALERT_RADIUS_METERS
): Promise<NearbyCctv[]> {
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) return [];

  const cameras = await prisma.cctvLocation.findMany({
    include: { zone: { select: { code: true } } },
  });

  const withDistance = cameras.map((cam) => ({
    id: cam.id,
    cameraId: cam.cameraId,
    lat: cam.lat,
    lng: cam.lng,
    zoneId: cam.zoneId,
    zoneCode: cam.zone.code,
    distanceMeters: haversineMeters(zone.centroidLat, zone.centroidLng, cam.lat, cam.lng),
  }));

  return withDistance
    .filter((cam) => cam.zoneId === zoneId || cam.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, CCTV_ALERT_LIMIT);
}

type CaseForAlert = Pick<
  Case,
  | "id"
  | "caseRef"
  | "personName"
  | "ageBand"
  | "gender"
  | "physicalDescription"
  | "lastSeenText"
  | "lastSeenAt"
  | "zoneId"
> & {
  zone?: Pick<Zone, "name" | "code"> | null;
  media?: Pick<CaseMedia, "cdnUrl">[];
};

export function buildCctvAlertMessage(caseRecord: CaseForAlert, cameraId: string): string {
  const parts = [
    `[KHUMMELA CCTV ALERT] Camera ${cameraId}`,
    `Case ${caseRecord.caseRef}: review footage for possible missing person.`,
    caseRecord.personName ? `Name: ${caseRecord.personName}` : null,
    caseRecord.ageBand ? `Age: ${caseRecord.ageBand}` : null,
    caseRecord.gender ? `Gender: ${caseRecord.gender}` : null,
    caseRecord.physicalDescription
      ? `Description: ${caseRecord.physicalDescription}`
      : null,
    caseRecord.lastSeenText
      ? `Last seen: ${caseRecord.lastSeenText}`
      : caseRecord.zone?.name
        ? `Last seen zone: ${caseRecord.zone.name}`
        : null,
    caseRecord.lastSeenAt
      ? `Last seen time: ${caseRecord.lastSeenAt.toISOString()}`
      : "Check footage from report time onward.",
    caseRecord.media?.[0]?.cdnUrl
      ? `Reference photo: ${caseRecord.media[0].cdnUrl}`
      : null,
  ];

  return parts.filter(Boolean).join(" | ");
}
