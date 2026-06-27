import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import {
  encodeCursor,
  decodeCursor,
  buildCursorWhere,
  type CursorFieldType,
} from "@/lib/pagination";
import type { ReportStatus, Gender, Prisma } from "@/app/generated/prisma/client";

const VALID_STATUSES = new Set<string>(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);
const VALID_GENDERS = new Set<string>(["MALE", "FEMALE", "OTHER", "UNKNOWN"]);

type SortFieldDef = { name: string; type: CursorFieldType };

const MISSING_SORT: Record<string, SortFieldDef> = {
  createdAt: { name: "createdAt", type: "date" },
  lastSeenAt: { name: "lastSeenAt", type: "date" },
  status: { name: "status", type: "string" },
  personName: { name: "personName", type: "string" },
  age: { name: "age", type: "number" },
};

const FOUND_SORT: Record<string, SortFieldDef> = {
  createdAt: { name: "createdAt", type: "date" },
  foundAt: { name: "foundAt", type: "date" },
  status: { name: "status", type: "string" },
  age: { name: "age", type: "number" },
};

const ALL_SORT: Record<string, SortFieldDef> = {
  createdAt: { name: "createdAt", type: "date" },
  status: { name: "status", type: "string" },
};

function andWhere<T>(conditions: unknown[]): T {
  if (conditions.length === 0) return {} as T;
  if (conditions.length === 1) return conditions[0] as T;
  return { AND: conditions } as T;
}

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const url = new URL(request.url);

  // Pagination
  const type = url.searchParams.get("type") ?? "all";
  const cursorParam = url.searchParams.get("cursor");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));

  // Sorting
  const rawSortBy = url.searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? ("asc" as const) : ("desc" as const);

  // Filters
  const statusParam = url.searchParams.get("status");
  const genderParam = url.searchParams.get("gender");
  const ageMinParam = url.searchParams.get("ageMin");
  const ageMaxParam = url.searchParams.get("ageMax");
  const city = url.searchParams.get("city") ?? undefined;
  const state = url.searchParams.get("state") ?? undefined;
  const country = url.searchParams.get("country") ?? undefined;
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const q = url.searchParams.get("q") ?? undefined;

  const isManagement = user.role === "MANAGEMENT";
  const status = statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as ReportStatus) : undefined;
  const gender = genderParam && VALID_GENDERS.has(genderParam) ? (genderParam as Gender) : undefined;
  const ageMin =
    ageMinParam && !isNaN(Number(ageMinParam)) ? Math.max(0, Number(ageMinParam)) : undefined;
  const ageMax =
    ageMaxParam && !isNaN(Number(ageMaxParam)) ? Math.min(150, Number(ageMaxParam)) : undefined;
  const fromDate = dateFrom ? new Date(dateFrom) : undefined;
  const toDate = dateTo ? new Date(dateTo) : undefined;
  const validFromDate = fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined;
  const validToDate = toDate && !isNaN(toDate.getTime()) ? toDate : undefined;

  const cursor = cursorParam ? decodeCursor(cursorParam) : null;
  const useCursor = cursor !== null;

  // Conditions shared between both report types
  const baseConditions: unknown[] = [
    ...(status ? [{ status }] : []),
    ...(!isManagement ? [{ reporterId: user.id }] : []),
    ...(gender ? [{ gender }] : []),
    ...(ageMin !== undefined || ageMax !== undefined
      ? [
          {
            age: {
              ...(ageMin !== undefined ? { gte: ageMin } : {}),
              ...(ageMax !== undefined ? { lte: ageMax } : {}),
            },
          },
        ]
      : []),
    ...(city || state || country
      ? [
          {
            location: {
              is: {
                ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
                ...(state ? { state: { contains: state, mode: "insensitive" } } : {}),
                ...(country ? { country: { contains: country, mode: "insensitive" } } : {}),
              },
            },
          },
        ]
      : []),
  ];

  // ── Missing reports ──────────────────────────────────────────────────────────
  if (type === "missing") {
    const { name: sortBy, type: fieldType } = MISSING_SORT[rawSortBy] ?? MISSING_SORT.createdAt;
    const dateRangeField = sortBy === "lastSeenAt" ? "lastSeenAt" : "createdAt";

    const conditions: unknown[] = [...baseConditions];

    if (q) {
      conditions.push({
        OR: [
          { personName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (validFromDate || validToDate) {
      conditions.push({
        [dateRangeField]: {
          ...(validFromDate ? { gte: validFromDate } : {}),
          ...(validToDate ? { lte: validToDate } : {}),
        },
      });
    }

    if (useCursor) conditions.push(buildCursorWhere(cursor, sortBy, sortOrder, fieldType));

    const where = andWhere<Prisma.MissingReportWhereInput>(conditions);
    const orderBy = [
      { [sortBy]: sortOrder },
      { id: sortOrder },
    ] as Prisma.MissingReportOrderByWithRelationInput[];

    if (useCursor) {
      const rows = await prisma.missingReport.findMany({
        where,
        take: limit + 1,
        orderBy,
        include: { location: true },
      });
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const last = items[items.length - 1];
      const nextCursor =
        last && hasMore
          ? encodeCursor(last.id, (last as Record<string, unknown>)[sortBy])
          : null;

      return NextResponse.json({
        data: items.map((r) => ({ ...r, reportType: "missing" })),
        pagination: { limit, hasMore, nextCursor },
      });
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.missingReport.findMany({ where, skip, take: limit, orderBy, include: { location: true } }),
      prisma.missingReport.count({ where }),
    ]);
    const last = rows[rows.length - 1];
    const nextCursor = last
      ? encodeCursor(last.id, (last as Record<string, unknown>)[sortBy])
      : null;

    return NextResponse.json({
      data: rows.map((r) => ({ ...r, reportType: "missing" })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), nextCursor },
    });
  }

  // ── Found reports ────────────────────────────────────────────────────────────
  if (type === "found") {
    const { name: sortBy, type: fieldType } = FOUND_SORT[rawSortBy] ?? FOUND_SORT.createdAt;
    const dateRangeField = sortBy === "foundAt" ? "foundAt" : "createdAt";

    const conditions: unknown[] = [...baseConditions];

    if (q) {
      conditions.push({ description: { contains: q, mode: "insensitive" } });
    }

    if (validFromDate || validToDate) {
      conditions.push({
        [dateRangeField]: {
          ...(validFromDate ? { gte: validFromDate } : {}),
          ...(validToDate ? { lte: validToDate } : {}),
        },
      });
    }

    if (useCursor) conditions.push(buildCursorWhere(cursor, sortBy, sortOrder, fieldType));

    const where = andWhere<Prisma.FoundReportWhereInput>(conditions);
    const orderBy = [
      { [sortBy]: sortOrder },
      { id: sortOrder },
    ] as Prisma.FoundReportOrderByWithRelationInput[];

    if (useCursor) {
      const rows = await prisma.foundReport.findMany({
        where,
        take: limit + 1,
        orderBy,
        include: { location: true },
      });
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const last = items[items.length - 1];
      const nextCursor =
        last && hasMore
          ? encodeCursor(last.id, (last as Record<string, unknown>)[sortBy])
          : null;

      return NextResponse.json({
        data: items.map((r) => ({ ...r, reportType: "found" })),
        pagination: { limit, hasMore, nextCursor },
      });
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.foundReport.findMany({ where, skip, take: limit, orderBy, include: { location: true } }),
      prisma.foundReport.count({ where }),
    ]);
    const last = rows[rows.length - 1];
    const nextCursor = last
      ? encodeCursor(last.id, (last as Record<string, unknown>)[sortBy])
      : null;

    return NextResponse.json({
      data: rows.map((r) => ({ ...r, reportType: "found" })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), nextCursor },
    });
  }

  // ── All (merged) — offset pagination only ───────────────────────────────────
  if (useCursor) {
    return NextResponse.json(
      {
        error:
          "Cursor pagination is not supported for type=all. Use type=missing or type=found, or use page-based pagination.",
      },
      { status: 400 }
    );
  }

  const { name: sortBy } = ALL_SORT[rawSortBy] ?? ALL_SORT.createdAt;

  const missingConditions: unknown[] = [...baseConditions];
  const foundConditions: unknown[] = [...baseConditions];

  if (validFromDate || validToDate) {
    const dateFilter = {
      createdAt: {
        ...(validFromDate ? { gte: validFromDate } : {}),
        ...(validToDate ? { lte: validToDate } : {}),
      },
    };
    missingConditions.push(dateFilter);
    foundConditions.push(dateFilter);
  }

  if (q) {
    missingConditions.push({
      OR: [
        { personName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
    foundConditions.push({ description: { contains: q, mode: "insensitive" } });
  }

  const missingWhere = andWhere<Prisma.MissingReportWhereInput>(missingConditions);
  const foundWhere = andWhere<Prisma.FoundReportWhereInput>(foundConditions);
  const orderBy = [{ [sortBy]: sortOrder }, { id: sortOrder }];
  const skip = (page - 1) * limit;

  const [missing, missingTotal, found, foundTotal] = await Promise.all([
    prisma.missingReport.findMany({
      where: missingWhere,
      skip,
      take: limit,
      orderBy: orderBy as Prisma.MissingReportOrderByWithRelationInput[],
      include: { location: true },
    }),
    prisma.missingReport.count({ where: missingWhere }),
    prisma.foundReport.findMany({
      where: foundWhere,
      skip,
      take: limit,
      orderBy: orderBy as Prisma.FoundReportOrderByWithRelationInput[],
      include: { location: true },
    }),
    prisma.foundReport.count({ where: foundWhere }),
  ]);

  const combined = [
    ...missing.map((r) => ({ ...r, reportType: "missing" as const })),
    ...found.map((r) => ({ ...r, reportType: "found" as const })),
  ].sort((a, b) => {
    if (sortBy === "status") {
      const cmp = a.status.localeCompare(b.status);
      return sortOrder === "desc" ? -cmp : cmp;
    }
    const cmp = a.createdAt.getTime() - b.createdAt.getTime();
    return sortOrder === "desc" ? -cmp : cmp;
  });

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
  });
}
