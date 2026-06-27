import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { updateCaseSchema } from "@/lib/validations/case";
import { redactCase } from "@/lib/case-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: { zone: true, media: true },
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ case: redactCase(caseRecord, session.user.role) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const role = session.user.role;

  if (!["SUPERVISOR", "POLICE", "VOLUNTEER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (
    parsed.data.status === "RESOLVED" &&
    !["SUPERVISOR", "POLICE"].includes(role)
  ) {
    return NextResponse.json(
      { error: "Only supervisors can resolve cases" },
      { status: 403 }
    );
  }

  const updateData = { ...parsed.data };
  if (parsed.data.status === "RESOLVED") {
    const existing = await prisma.case.findUnique({ where: { id } });
    if (existing && !existing.resolutionHours) {
      const hours =
        (Date.now() - existing.reportedAt.getTime()) / (1000 * 60 * 60);
      Object.assign(updateData, { resolutionHours: hours });
    }
  }

  const updated = await prisma.case.update({
    where: { id },
    data: updateData,
    include: { zone: true, media: true },
  });

  return NextResponse.json({ case: redactCase(updated, role) });
}
