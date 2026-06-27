import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/api-auth";
import { findMatches } from "@/lib/matching";

export async function POST(req: NextRequest) {
  const authResult = await requireStaff();
  if ("error" in authResult) return authResult.error;

  let body: { foundCaseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.foundCaseId) {
    return NextResponse.json({ error: "foundCaseId required" }, { status: 400 });
  }

  const foundCase = await prisma.case.findUnique({ where: { id: body.foundCaseId } });
  if (!foundCase || foundCase.type !== "FOUND") {
    return NextResponse.json({ error: "Found case not found" }, { status: 404 });
  }

  const missingCases = await prisma.case.findMany({
    where: { type: "MISSING", status: { in: ["OPEN", "MATCH_PENDING"] } },
  });

  const matches = findMatches(missingCases, foundCase);
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

  return NextResponse.json({ matches });
}
