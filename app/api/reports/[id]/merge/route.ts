import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

function calculateSimilarity(report1: any, report2: any): number {
  let score = 0;

  // Name similarity (for missing reports)
  if (report1.personName && report2.personName) {
    const name1 = report1.personName.toLowerCase();
    const name2 = report2.personName.toLowerCase();
    if (name1 === name2) {
      score += 30;
    } else {
      // Simple substring/word overlap check
      const words1 = name1.split(/\s+/);
      const words2 = name2.split(/\s+/);
      const matches = words1.filter((w: string) => words2.includes(w)).length;
      score += (matches / Math.max(words1.length, words2.length)) * 20;
    }
  }

  // Age similarity
  if (report1.age && report2.age) {
    const ageDiff = Math.abs(report1.age - report2.age);
    if (ageDiff === 0) {
      score += 20;
    } else if (ageDiff <= 2) {
      score += 15;
    } else if (ageDiff <= 5) {
      score += 10;
    }
  }

  // Gender match
  if (report1.gender === report2.gender && report1.gender !== "UNKNOWN") {
    score += 15;
  }

  // Location match
  if (report1.locationId && report2.locationId && report1.locationId === report2.locationId) {
    score += 20;
  }

  // Description similarity
  if (report1.description && report2.description) {
    const desc1 = report1.description.toLowerCase();
    const desc2 = report2.description.toLowerCase();
    const words1 = desc1.split(/\s+/);
    const words2 = desc2.split(/\s+/);
    const matches = words1.filter((w: string) => words2.includes(w)).length;
    const similarity = (matches / Math.max(words1.length, words2.length)) * 15;
    score += Math.min(15, similarity);
  }

  return Math.round(score);
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  if (user.role !== "MANAGEMENT") {
    return NextResponse.json(
      { error: "Only MANAGEMENT can detect duplicates" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const missing = await prisma.missingReport.findUnique({
    where: { id },
    include: { location: true },
  });

  if (!missing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Find similar reports
  const potentialDuplicates = await prisma.missingReport.findMany({
    where: {
      id: { not: id },
      status: "OPEN",
    },
    include: { location: true },
  });

  const scored = potentialDuplicates
    .map((dup) => ({
      id: dup.id,
      personName: dup.personName,
      age: dup.age,
      gender: dup.gender,
      description: dup.description,
      createdAt: dup.createdAt,
      similarity: calculateSimilarity(missing, dup),
    }))
    .filter((dup) => dup.similarity >= 30) // Only suggest if > 30% similar
    .sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({
    data: {
      reportId: id,
      potentialDuplicates: scored,
    },
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  if (user.role !== "MANAGEMENT") {
    return NextResponse.json(
      { error: "Only MANAGEMENT can merge reports" },
      { status: 403 }
    );
  }

  const { id } = await params;
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

  if (typeof b.mergeWithId !== "string") {
    return NextResponse.json({ error: "mergeWithId is required" }, { status: 400 });
  }

  const mergeWithId = b.mergeWithId as string;

  // Fetch both reports
  const [report1, report2] = await Promise.all([
    prisma.missingReport.findUnique({ where: { id } }),
    prisma.missingReport.findUnique({ where: { id: mergeWithId } }),
  ]);

  if (!report1 || !report2) {
    return NextResponse.json({ error: "One or both reports not found" }, { status: 404 });
  }

  // Keep the older report, update with non-empty fields from the newer one
  const keepReport = report1.createdAt < report2.createdAt ? report1 : report2;
  const mergeReport = report1.createdAt < report2.createdAt ? report2 : report1;

  // Update keep report with any missing data from merge report
  const updated = await prisma.missingReport.update({
    where: { id: keepReport.id },
    data: {
      // Use non-empty values from both
      age: keepReport.age ?? mergeReport.age,
      gender: keepReport.gender === "UNKNOWN" ? mergeReport.gender : keepReport.gender,
      description: keepReport.description ?? mergeReport.description,
    },
    include: { location: true },
  });

  // Move images from merge report to keep report
  await prisma.reportImage.updateMany({
    where: { missingReportId: mergeReport.id },
    data: { missingReportId: keepReport.id },
  });

  // Close merge report
  await prisma.missingReport.update({
    where: { id: mergeReport.id },
    data: { status: "CLOSED" },
  });

  // Audit logs
  await createAuditLog({
    userId: user.id,
    action: "UPDATED",
    entityType: "MISSING_REPORT",
    entityId: keepReport.id,
    missingReportId: keepReport.id,
    metadata: {
      action: "merge",
      mergedWithId: mergeReport.id,
      reason: "Duplicate detection and merge",
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATED",
    entityType: "MISSING_REPORT",
    entityId: mergeReport.id,
    missingReportId: mergeReport.id,
    metadata: {
      action: "closed_as_duplicate",
      mergedIntoId: keepReport.id,
    },
  });

  return NextResponse.json({
    data: {
      kept: updated,
      closed: mergeReport.id,
      message: "Reports merged successfully",
    },
  });
}
