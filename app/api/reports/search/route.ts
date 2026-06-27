import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import type { ReportStatus, Gender, Prisma } from "@/app/generated/prisma/client";

const VALID_STATUSES = new Set<string>(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);
const VALID_GENDERS = new Set<string>(["MALE", "FEMALE", "OTHER", "UNKNOWN"]);

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const url = new URL(request.url);

  // Search and filters
  const query = url.searchParams.get("q") ?? "";
  const caseNumber = url.searchParams.get("caseNumber") ?? undefined;
  const name = url.searchParams.get("name") ?? undefined;
  const genderParam = url.searchParams.get("gender") ?? undefined;
  const ageMinParam = url.searchParams.get("ageMin") ?? undefined;
  const ageMaxParam = url.searchParams.get("ageMax") ?? undefined;
  const language = url.searchParams.get("language") ?? undefined;
  const state = url.searchParams.get("state") ?? undefined;
  const district = url.searchParams.get("district") ?? undefined;
  const zone = url.searchParams.get("zone") ?? undefined;
  const helpCenter = url.searchParams.get("helpCenter") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;

  // Pagination
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));

  // Validate and parse filters
  const gender = genderParam && VALID_GENDERS.has(genderParam) ? (genderParam as Gender) : undefined;
  const status = statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as ReportStatus) : undefined;
  const ageMin = ageMinParam && !isNaN(Number(ageMinParam)) ? Math.max(0, Number(ageMinParam)) : undefined;
  const ageMax = ageMaxParam && !isNaN(Number(ageMaxParam)) ? Math.min(150, Number(ageMaxParam)) : undefined;

  const isManagement = user.role === "MANAGEMENT";

  // Build common WHERE conditions
  const buildConditions = () => {
    const conditions: Prisma.MissingReportWhereInput[] = [];

    if (!isManagement) {
      conditions.push({ reporterId: user.id });
    }

    if (status) {
      conditions.push({ status });
    }

    if (gender) {
      conditions.push({ gender });
    }

    if (ageMin !== undefined || ageMax !== undefined) {
      conditions.push({
        age: {
          ...(ageMin !== undefined ? { gte: ageMin } : {}),
          ...(ageMax !== undefined ? { lte: ageMax } : {}),
        },
      });
    }

    if (state || district || zone || helpCenter) {
      conditions.push({
        location: {
          is: {
            ...(state ? { state: { contains: state, mode: "insensitive" } } : {}),
            ...(district ? { city: { contains: district, mode: "insensitive" } } : {}),
          },
        },
      });
    }

    return conditions;
  };

  const missingConditions = buildConditions();
  const foundConditions = buildConditions();

  // Search with full-text or filter only
  const searchQuery = query || name || "";

  let missingResults: any[] = [];
  if (searchQuery) {
    const offset = (page - 1) * limit;
    missingResults = await prisma.$queryRaw`
      SELECT m."id", m."reporterId", m."personName", m."age", m."gender", m."description",
             m."lastSeenAt", m."locationId", m."status", m."contactName", m."contactPhone",
             m."contactEmail", m."createdAt", m."updatedAt",
             ts_rank(
               to_tsvector('english', COALESCE(m."personName", '') || ' ' || COALESCE(m."description", '')),
               plainto_tsquery('english', ${searchQuery})
             ) as "relevance"
      FROM "MissingReport" m
      LEFT JOIN "Location" l ON m."locationId" = l."id"
      WHERE (
        to_tsvector('english', COALESCE(m."personName", '') || ' ' || COALESCE(m."description", ''))
        @@ plainto_tsquery('english', ${searchQuery})
      )
      ${!isManagement ? Prisma.sql`AND m."reporterId" = ${user.id}` : Prisma.empty}
      ${status ? Prisma.sql`AND m."status" = ${status}` : Prisma.empty}
      ${gender ? Prisma.sql`AND m."gender" = ${gender}` : Prisma.empty}
      ${ageMin !== undefined ? Prisma.sql`AND m."age" >= ${ageMin}` : Prisma.empty}
      ${ageMax !== undefined ? Prisma.sql`AND m."age" <= ${ageMax}` : Prisma.empty}
      ${state ? Prisma.sql`AND l."state" ILIKE ${'%' + state + '%'}` : Prisma.empty}
      ${district ? Prisma.sql`AND l."city" ILIKE ${'%' + district + '%'}` : Prisma.empty}
      ORDER BY "relevance" DESC, m."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  } else {
    missingResults = await prisma.missingReport.findMany({
      where: missingConditions.length > 0 ? { AND: missingConditions } : {},
      include: { location: true },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
    });
  }

  let foundResults: any[] = [];
  if (searchQuery) {
    const offset = (page - 1) * limit;
    foundResults = await prisma.$queryRaw`
      SELECT f."id", f."reporterId", f."age", f."gender", f."description",
             f."foundAt", f."locationId", f."status", f."contactName", f."contactPhone",
             f."contactEmail", f."createdAt", f."updatedAt",
             ts_rank(
               to_tsvector('english', COALESCE(f."description", '')),
               plainto_tsquery('english', ${searchQuery})
             ) as "relevance"
      FROM "FoundReport" f
      LEFT JOIN "Location" l ON f."locationId" = l."id"
      WHERE (
        to_tsvector('english', COALESCE(f."description", ''))
        @@ plainto_tsquery('english', ${searchQuery})
      )
      ${!isManagement ? Prisma.sql`AND f."reporterId" = ${user.id}` : Prisma.empty}
      ${status ? Prisma.sql`AND f."status" = ${status}` : Prisma.empty}
      ${gender ? Prisma.sql`AND f."gender" = ${gender}` : Prisma.empty}
      ${ageMin !== undefined ? Prisma.sql`AND f."age" >= ${ageMin}` : Prisma.empty}
      ${ageMax !== undefined ? Prisma.sql`AND f."age" <= ${ageMax}` : Prisma.empty}
      ${state ? Prisma.sql`AND l."state" ILIKE ${'%' + state + '%'}` : Prisma.empty}
      ${district ? Prisma.sql`AND l."city" ILIKE ${'%' + district + '%'}` : Prisma.empty}
      ORDER BY "relevance" DESC, f."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  } else {
    foundResults = await prisma.foundReport.findMany({
      where: foundConditions.length > 0 ? { AND: foundConditions } : {},
      include: { location: true },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
    });
  }

  // Combine and sort results
  const combined = [
    ...missingResults.map((r) => ({ ...r, reportType: "missing" as const })),
    ...foundResults.map((r) => ({ ...r, reportType: "found" as const })),
  ].sort((a, b) => {
    const aRel = (a as any).relevance ?? 0;
    const bRel = (b as any).relevance ?? 0;
    if (aRel !== bRel) return bRel - aRel;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Get total counts
  const [missingTotal, foundTotal] = await Promise.all([
    prisma.missingReport.count({
      where: missingConditions.length > 0 ? { AND: missingConditions } : {},
    }),
    prisma.foundReport.count({
      where: foundConditions.length > 0 ? { AND: foundConditions } : {},
    }),
  ]);

  return NextResponse.json({
    data: combined,
    pagination: {
      page,
      limit,
      missingTotal,
      foundTotal,
      total: missingTotal + foundTotal,
      totalPages: Math.ceil((missingTotal + foundTotal) / limit),
    },
    filters: {
      query,
      caseNumber,
      name,
      gender,
      ageMin,
      ageMax,
      language,
      state,
      district,
      zone,
      helpCenter,
      status,
    },
  });
}
