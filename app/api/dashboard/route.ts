import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";

export async function GET(_request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const isManagement = user.role === "MANAGEMENT";

  if (isManagement) {
    // Management dashboard
    const [
      pendingMatches,
      confirmedMatches,
      rejectedMatches,
      openMissing,
      openFound,
      investigatingReports,
      unresolvedByGender,
      recentMatches,
    ] = await Promise.all([
      prisma.matchSuggestion.count({ where: { status: "PENDING" } }),
      prisma.matchSuggestion.count({ where: { status: "CONFIRMED" } }),
      prisma.matchSuggestion.count({ where: { status: "REJECTED" } }),
      prisma.missingReport.count({ where: { status: "OPEN" } }),
      prisma.foundReport.count({ where: { status: "OPEN" } }),
      prisma.missingReport.count({
        where: { status: "INVESTIGATING" },
      }),
      prisma.missingReport.groupBy({
        by: ["gender"],
        where: { status: "OPEN" },
        _count: true,
      }),
      prisma.matchSuggestion.findMany({
        where: { status: "PENDING" },
        include: {
          missingReport: true,
          foundReport: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Calculate age groups
    const ageGroups = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN age < 5 THEN '0-4'
          WHEN age < 13 THEN '5-12'
          WHEN age < 18 THEN '13-17'
          WHEN age < 30 THEN '18-29'
          WHEN age < 60 THEN '30-59'
          ELSE '60+'
        END as "ageGroup",
        COUNT(*) as count
      FROM "MissingReport"
      WHERE status = 'OPEN'
      GROUP BY "ageGroup"
      ORDER BY "ageGroup"
    `;

    return NextResponse.json({
      data: {
        role: "MANAGEMENT",
        stats: {
          pending: pendingMatches,
          confirmed: confirmedMatches,
          rejected: rejectedMatches,
          openMissing,
          openFound,
          investigating: investigatingReports,
        },
        unresolvedByGender,
        unresolvedByAge: ageGroups,
        verificationQueue: recentMatches.map((m) => ({
          id: m.id,
          missingReport: {
            id: m.missingReport.id,
            personName: m.missingReport.personName,
            age: m.missingReport.age,
            gender: m.missingReport.gender,
          },
          foundReport: {
            id: m.foundReport.id,
            age: m.foundReport.age,
            gender: m.foundReport.gender,
          },
          score: m.score,
          createdAt: m.createdAt,
        })),
      },
    });
  } else {
    // User (volunteer) dashboard
    const [
      myMissing,
      myFound,
      myPending,
      myConfirmed,
      recentReports,
      pendingMatches,
    ] = await Promise.all([
      prisma.missingReport.count({
        where: { reporterId: user.id, status: "OPEN" },
      }),
      prisma.foundReport.count({
        where: { reporterId: user.id, status: "OPEN" },
      }),
      prisma.matchSuggestion.count({
        where: {
          status: "PENDING",
          OR: [
            { missingReport: { reporterId: user.id } },
            { foundReport: { reporterId: user.id } },
          ],
        },
      }),
      prisma.matchSuggestion.count({
        where: {
          status: "CONFIRMED",
          OR: [
            { missingReport: { reporterId: user.id } },
            { foundReport: { reporterId: user.id } },
          ],
        },
      }),
      prisma.missingReport.findMany({
        where: { reporterId: user.id, status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.matchSuggestion.findMany({
        where: {
          status: "PENDING",
          OR: [
            { missingReport: { reporterId: user.id } },
            { foundReport: { reporterId: user.id } },
          ],
        },
        include: {
          missingReport: true,
          foundReport: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      data: {
        role: "USER",
        stats: {
          myOpenMissing: myMissing,
          myOpenFound: myFound,
          pendingMatches: myPending,
          confirmedMatches: myConfirmed,
        },
        recentReports: recentReports.map((r) => ({
          id: r.id,
          personName: r.personName,
          age: r.age,
          gender: r.gender,
          status: r.status,
          createdAt: r.createdAt,
        })),
        pendingMatches: pendingMatches.map((m) => ({
          id: m.id,
          missingReport: {
            id: m.missingReport.id,
            personName: m.missingReport.personName,
            age: m.missingReport.age,
          },
          foundReport: {
            id: m.foundReport.id,
            age: m.foundReport.age,
          },
          score: m.score,
          createdAt: m.createdAt,
        })),
      },
    });
  }
}
