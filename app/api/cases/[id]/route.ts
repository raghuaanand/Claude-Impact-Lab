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

  if (!["SUPERVISOR", "POLICE", "VOLUNTEER"].includes(session.user.role)) {
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

  const updated = await prisma.case.update({
    where: { id },
    data: parsed.data,
    include: { zone: true, media: true },
  });

  return NextResponse.json({ case: redactCase(updated, session.user.role) });
}
