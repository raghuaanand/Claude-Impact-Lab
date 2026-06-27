import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCaseSchema } from "@/lib/validations/case";
import { redactCase } from "@/lib/case-access";
import { generateCaseRef } from "@/lib/cases";
import { detectDuplicateFlags, findMatches } from "@/lib/matching";
import { dispatchCctvAlertsForCase } from "@/lib/cctv-dispatch";
import { Prisma } from "@/app/generated/prisma/client";
import type { Role } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const zoneId = searchParams.get("zoneId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const reportingCenter = searchParams.get("reportingCenter");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  const where: Prisma.CaseWhereInput = {};

  if (zoneId) where.zoneId = zoneId;
  if (status) where.status = status as Prisma.CaseWhereInput["status"];
  if (type) where.type = type as Prisma.CaseWhereInput["type"];
  if (reportingCenter) where.reportingCenter = { contains: reportingCenter, mode: "insensitive" };

  if (q) {
    where.OR = [
      { personName: { contains: q, mode: "insensitive" } },
      { caseRef: { contains: q, mode: "insensitive" } },
      { lastSeenText: { contains: q, mode: "insensitive" } },
      { physicalDescription: { contains: q, mode: "insensitive" } },
      { reportingCenter: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role === "VOLUNTEER") {
    const assignment = await prisma.volunteerAssignment.findUnique({
      where: { userId: session.user.id },
    });
    if (assignment && !zoneId && !q) {
      where.zoneId = assignment.zoneId;
    }
  }

  const cases = await prisma.case.findMany({
    where,
    include: { zone: true, media: true },
    orderBy: { reportedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    cases: cases.map((c) => redactCase(c, role)),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role: Role = session?.user?.role ?? "FAMILY";
    const reporterId = session?.user?.id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    const openCases = await prisma.case.findMany({
      where: { status: { in: ["OPEN", "MATCH_PENDING"] } },
      take: 500,
      orderBy: { reportedAt: "desc" },
    });

    const duplicateOf = detectDuplicateFlags(
      {
        personName: data.personName ?? null,
        reporterPhone: data.reporterPhone ?? null,
        ageBand: data.ageBand,
        gender: data.gender,
        physicalDescription: data.physicalDescription ?? null,
        reportingCenter: data.reportingCenter ?? null,
      },
      openCases
    );

    const createData = {
      type: data.type,
      personName: data.personName,
      ageBand: data.ageBand,
      gender: data.gender,
      language: data.language,
      state: data.state,
      district: data.district,
      physicalDescription: data.physicalDescription,
      lastSeenText: data.lastSeenText,
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : undefined,
      reportingCenter: data.reportingCenter,
      reporterPhone: data.reporterPhone,
      zoneId: data.zoneId,
      remarks: data.remarks,
      reporterId,
      isDuplicate: Boolean(duplicateOf),
      duplicateOfId: duplicateOf?.id,
      status: duplicateOf ? ("DUPLICATE" as const) : ("OPEN" as const),
    };

    let created = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        created = await prisma.case.create({
          data: {
            ...createData,
            caseRef: await generateCaseRef(data.type),
          },
          include: { zone: true, media: true },
        });
        break;
      } catch (err) {
        const isRefCollision =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isRefCollision || attempt === 4) throw err;
      }
    }

    if (!created) {
      return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
    }

    if (data.type === "FOUND" && !duplicateOf) {
      const missingCases = await prisma.case.findMany({
        where: { type: "MISSING", status: { in: ["OPEN", "MATCH_PENDING"] } },
      });
      const matches = findMatches(missingCases, created);
      for (const m of matches) {
        await prisma.match.upsert({
          where: {
            missingCaseId_foundCaseId: {
              missingCaseId: m.missingCaseId,
              foundCaseId: m.foundCaseId,
            },
          },
          create: {
            missingCaseId: m.missingCaseId,
            foundCaseId: m.foundCaseId,
            score: m.score,
            status: "SUGGESTED",
          },
          update: { score: m.score },
        });
      }
      if (matches.length > 0) {
        await prisma.case.update({
          where: { id: created.id },
          data: { status: "MATCH_PENDING" },
        });
        created.status = "MATCH_PENDING";
      }
    }

    if (
      data.type === "MISSING" &&
      !duplicateOf &&
      data.zoneId &&
      created.status !== "DUPLICATE"
    ) {
      void dispatchCctvAlertsForCase(created.id).catch((err) => {
        console.error("[KHUMMELA CCTV] Auto-dispatch failed:", err);
      });
    }

    return NextResponse.json({ case: redactCase(created, role) }, { status: 201 });
  } catch (error) {
    console.error("[KHUMMELA] POST /api/cases failed:", error);
    return NextResponse.json(
      { error: "Failed to submit report. Please try again." },
      { status: 500 }
    );
  }
}
