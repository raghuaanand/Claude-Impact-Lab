import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { mapCsvStatus, mapMelaCategory } from "../lib/cases";

const DATA_DIR = join(process.cwd(), "data", "mumbai-2026");
const CASE_LIMIT = process.env.SEED_CASE_LIMIT
  ? parseInt(process.env.SEED_CASE_LIMIT, 10)
  : undefined;

function readCsv(filename: string): Record<string, string>[] {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    console.warn(`Skip ${filename} — file not found at ${path}`);
    return [];
  }
  const content = readFileSync(path, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding zones…");
  const zoneRows = readCsv("Zone_Boundaries.csv");
  const zoneMap = new Map<string, string>();

  for (let i = 0; i < zoneRows.length; i++) {
    const row = zoneRows[i];
    const code = `Z${i + 1}`;
    const zone = await prisma.zone.upsert({
      where: { code },
      create: {
        code,
        name: row.zone_name,
        centroidLat: parseFloat(row.centroid_lat),
        centroidLng: parseFloat(row.centroid_lng),
        boundaryPointCount: parseInt(row.approx_boundary_points, 10) || null,
      },
      update: {
        name: row.zone_name,
        centroidLat: parseFloat(row.centroid_lat),
        centroidLng: parseFloat(row.centroid_lng),
        boundaryPointCount: parseInt(row.approx_boundary_points, 10) || null,
      },
    });
    zoneMap.set(code, zone.id);
    zoneMap.set(row.zone_name.toLowerCase(), zone.id);
  }

  console.log("Seeding police stations…");
  for (const row of readCsv("Police_Stations.csv")) {
    await prisma.policeStation.upsert({
      where: { name: row.station_name },
      create: {
        name: row.station_name,
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
      },
      update: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
      },
    });
  }

  console.log("Seeding mela locations…");
  for (const row of readCsv("Chokepoints_Parking.csv")) {
    const category = mapMelaCategory(row.category);
    await prisma.melaLocation.upsert({
      where: { name_category: { name: row.location_name, category } },
      create: {
        name: row.location_name,
        category,
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
      },
      update: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
      },
    });
  }

  console.log("Seeding CCTV locations…");
  for (const row of readCsv("CCTV_Locations.csv")) {
    const zoneCode = row.camera_id.split("-")[0];
    const zoneId = zoneMap.get(zoneCode);
    if (!zoneId) continue;
    await prisma.cctvLocation.upsert({
      where: { cameraId: row.camera_id },
      create: {
        cameraId: row.camera_id,
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        zoneId,
      },
      update: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        zoneId,
      },
    });
  }

  console.log("Seeding cases…");
  let caseRows = readCsv("Synthetic_Missing_Persons_2500.csv");
  if (CASE_LIMIT) caseRows = caseRows.slice(0, CASE_LIMIT);

  for (const row of caseRows) {
    const reportedAt = new Date(row.reported_at.replace(" ", "T") + ":00");
    const zoneId =
      zoneMap.get((row.last_seen_location ?? "").toLowerCase()) ?? [...zoneMap.values()][0];

    await prisma.case.upsert({
      where: { caseRef: row.case_id },
      create: {
        caseRef: row.case_id,
        type: "MISSING",
        status: mapCsvStatus(row.status),
        zoneId,
        personName: row.missing_person_name || null,
        ageBand: row.age_band,
        gender: row.gender,
        language: row.language,
        state: row.state,
        district: row.district,
        physicalDescription: row.physical_description || null,
        lastSeenText: row.last_seen_location,
        reportingCenter: row.reporting_center,
        reporterPhone: row.reporter_mobile || null,
        isDuplicate: row.is_duplicate_report === "True",
        resolutionHours: row.resolution_hours ? parseFloat(row.resolution_hours) : null,
        remarks: row.remarks || null,
        reportedAt,
      },
      update: {
        status: mapCsvStatus(row.status),
        personName: row.missing_person_name || null,
        isDuplicate: row.is_duplicate_report === "True",
        resolutionHours: row.resolution_hours ? parseFloat(row.resolution_hours) : null,
      },
    });
  }

  console.log("Seed complete.");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
