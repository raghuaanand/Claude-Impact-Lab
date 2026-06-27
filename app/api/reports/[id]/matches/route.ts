import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import type { Prisma } from "@/app/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

function calculateMatchScore(report1: any, report2: any): number {
  let score = 0;

  // Age match
  if (report1.age !== null && report2.age !== null) {
    const ageDiff = Math.abs(report1.age - report2.age);
    if (ageDiff === 0) {
      score += 25;
    } else if (ageDiff <= 5) {
      score += 15;
    } else if (ageDiff <= 10) {
      score += 5;
    }
  }

  // Gender match
  if (report1.gender === report2.gender) {
    score += 20;
  }

  // Location match
  if (report1.locationId && report2.locationId) {
    if (report1.locationId === report2.locationId) {
      score += 30;
    } else if (report1.location?.state === report2.location?.state) {
      score += 15;
    } else if (report1.location?.city === report2.location?.city) {
      score += 20;
    }
  }

  // Description similarity
  if (report1.description && report2.description) {
    const words1 = report1.description.toLowerCase().split(/\s+/);
    const text2 = report2.description.toLowerCase();
    const matches = words1.filter((word: string) => text2.includes(word)).length;
    const similarity = (matches / words1.length) * 10;
    score += Math.min(10, similarity);
  }

  return Math.round(score);
}

async function findReport(id: string) {
  const missing = await prisma.missingReport.findUnique({
    where: { id },
    include: { location: true },
  });
  if (missing) return { report: missing, type: "missing" as const };

  const found = await prisma.foundReport.findUnique({
    where: { id },
    include: { location: true },
  });
  if (found) return { report: found, type: "found" as const };

  return null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const { id } = await params;
  const result = await findReport(id);

  if (!result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { report, type } = result;

  const isManagement = user.role === "MANAGEMENT";
  if (!isManagement && report.reporterId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find opposite report type with similar characteristics
  let potentialMatches: any[] = [];

  if (type === "missing") {
    // Find found reports that might match this missing person
    potentialMatches = await prisma.foundReport.findMany({
      where: {
        status: "OPEN",
        ...(report.gender !== "UNKNOWN" ? { gender: report.gender } : {}),
        ...(report.age
          ? {
              age: {
                gte: Math.max(0, report.age - 15),
                lte: Math.min(150, report.age + 15),
              },
            }
          : {}),
      },
      include: { location: true },
      take: 50,
    });
  } else {
    // Find missing reports that might match this found person
    potentialMatches = await prisma.missingReport.findMany({
      where: {
        status: "OPEN",
        ...(report.gender !== "UNKNOWN" ? { gender: report.gender } : {}),
        ...(report.age
          ? {
              age: {
                gte: Math.max(0, report.age - 15),
                lte: Math.min(150, report.age + 15),
              },
            }
          : {}),
      },
      include: { location: true },
      take: 50,
    });
  }

  // Calculate scores and sort
  const scored = potentialMatches
    .map((match) => ({
      id: match.id,
      type: type === "missing" ? "found" : "missing",
      age: match.age,
      gender: match.gender,
      location: match.location
        ? {
            city: match.location.city,
            state: match.location.state,
            country: match.location.country,
          }
        : null,
      description: match.description ? match.description.substring(0, 100) : null,
      createdAt: match.createdAt,
      score: calculateMatchScore(report, match),
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    data: {
      reportId: id,
      reportType: type,
      potentialMatches: scored,
    },
  });
}
