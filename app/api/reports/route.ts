import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import type { ReportStatus } from "@/app/generated/prisma/client";

const VALID_STATUSES = new Set<string>(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "all";
  const statusParam = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const isManagement = user.role === "MANAGEMENT";
  const status =
    statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as ReportStatus) : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(!isManagement ? { reporterId: user.id } : {}),
  };

  if (type === "missing") {
    const [data, total] = await Promise.all([
      prisma.missingReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { location: true },
      }),
      prisma.missingReport.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map((r) => ({ ...r, reportType: "missing" })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  if (type === "found") {
    const [data, total] = await Promise.all([
      prisma.foundReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { location: true },
      }),
      prisma.foundReport.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map((r) => ({ ...r, reportType: "found" })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  // type === "all" — query both tables, merge by createdAt desc
  const [missing, missingTotal, found, foundTotal] = await Promise.all([
    prisma.missingReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { location: true },
    }),
    prisma.missingReport.count({ where }),
    prisma.foundReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { location: true },
    }),
    prisma.foundReport.count({ where }),
  ]);

  const combined = [
    ...missing.map((r) => ({ ...r, reportType: "missing" as const })),
    ...found.map((r) => ({ ...r, reportType: "found" as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
