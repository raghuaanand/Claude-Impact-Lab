import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import type { Prisma } from "@/app/generated/prisma/client";

async function findMissingReport(id: string) {
  return prisma.missingReport.findUnique({
    where: { id },
    include: { location: true },
  });
}

async function findFoundReport(id: string) {
  return prisma.foundReport.findUnique({
    where: { id },
    include: { location: true },
  });
}

function calculateMatchScore(missing: any, found: any): number {
  let score = 0;

  // Age match (within 5 years or exact)
  if (missing.age !== null && found.age !== null) {
    const ageDiff = Math.abs(missing.age - found.age);
    if (ageDiff === 0) {
      score += 25;
    } else if (ageDiff <= 5) {
      score += 15;
    } else if (ageDiff <= 10) {
      score += 5;
    }
  }

  // Gender match
  if (missing.gender === found.gender) {
    score += 20;
  }

  // Location match
  if (missing.locationId && found.locationId) {
    if (missing.locationId === found.locationId) {
      score += 30;
    } else if (missing.location?.state === found.location?.state) {
      score += 15;
    } else if (missing.location?.city === found.location?.city) {
      score += 20;
    }
  }

  // Description similarity (simple substring match)
  if (missing.description && found.description) {
    const missingWords = missing.description.toLowerCase().split(/\s+/);
    const foundText = found.description.toLowerCase();
    const matches = missingWords.filter((word: string) => foundText.includes(word)).length;
    const similarity = (matches / missingWords.length) * 10;
    score += Math.min(10, similarity);
  }

  return Math.round(score);
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (typeof b.missingReportId !== "string" || !b.missingReportId.trim()) {
    return NextResponse.json({ error: "missingReportId is required" }, { status: 400 });
  }

  if (typeof b.foundReportId !== "string" || !b.foundReportId.trim()) {
    return NextResponse.json({ error: "foundReportId is required" }, { status: 400 });
  }

  const missingReportId = b.missingReportId.trim();
  const foundReportId = b.foundReportId.trim();

  // Fetch both reports
  const [missing, found] = await Promise.all([
    findMissingReport(missingReportId),
    findFoundReport(foundReportId),
  ]);

  if (!missing) {
    return NextResponse.json({ error: "Missing report not found" }, { status: 404 });
  }

  if (!found) {
    return NextResponse.json({ error: "Found report not found" }, { status: 404 });
  }

  // Check if match already exists
  const existingMatch = await prisma.matchSuggestion.findUnique({
    where: {
      missingReportId_foundReportId: {
        missingReportId,
        foundReportId,
      },
    },
  });

  if (existingMatch) {
    return NextResponse.json(
      { error: "Match suggestion already exists for these reports" },
      { status: 409 }
    );
  }

  // Calculate match score
  const score = calculateMatchScore(missing, found);

  // Create match suggestion
  const suggestion = await prisma.matchSuggestion.create({
    data: {
      missingReportId,
      foundReportId,
      score,
      status: "PENDING",
      suggestedById: user.id,
    },
    include: {
      missingReport: { include: { location: true } },
      foundReport: { include: { location: true } },
    },
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: "MATCH_SUGGESTED",
    entityType: "MATCH_SUGGESTION",
    entityId: suggestion.id,
    metadata: {
      missingReportId,
      foundReportId,
      score,
    },
  });

  return NextResponse.json({ data: suggestion }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const url = new URL(request.url);

  // Filters
  const statusParam = url.searchParams.get("status") ?? undefined;
  const missingReportId = url.searchParams.get("missingReportId") ?? undefined;
  const foundReportId = url.searchParams.get("foundReportId") ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));

  const isManagement = user.role === "MANAGEMENT";

  const conditions: Prisma.MatchSuggestionWhereInput[] = [];

  if (statusParam && ["PENDING", "CONFIRMED", "REJECTED"].includes(statusParam)) {
    conditions.push({ status: statusParam as any });
  }

  if (missingReportId) {
    conditions.push({ missingReportId });
  }

  if (foundReportId) {
    conditions.push({ foundReportId });
  }

  // Non-management users see only matches for their own reports
  if (!isManagement) {
    conditions.push({
      OR: [
        { missingReport: { reporterId: user.id } },
        { foundReport: { reporterId: user.id } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};
  const skip = (page - 1) * limit;

  const [suggestions, total] = await Promise.all([
    prisma.matchSuggestion.findMany({
      where,
      include: {
        missingReport: { include: { location: true } },
        foundReport: { include: { location: true } },
        suggestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.matchSuggestion.count({ where }),
  ]);

  return NextResponse.json({
    data: suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
