import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupervisor } from "@/lib/api-auth";
import { matchReviewSchema } from "@/lib/validations/case";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requireSupervisor();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = matchReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: { missingCase: true, foundCase: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (parsed.data.status === "APPROVED") {
    const resolvedAt = new Date();
    const hours =
      (resolvedAt.getTime() - match.missingCase.reportedAt.getTime()) / (1000 * 60 * 60);

    await prisma.case.update({
      where: { id: match.missingCaseId },
      data: { status: "RESOLVED", resolutionHours: hours },
    });
    await prisma.case.update({
      where: { id: match.foundCaseId },
      data: { status: "RESOLVED", resolutionHours: hours },
    });

    await prisma.reunification.create({
      data: {
        caseId: match.missingCaseId,
        matchId: match.id,
        verifiedById: session.user.id,
        notes: parsed.data.notes,
      },
    });
  }

  return NextResponse.json({ match: updated });
}
