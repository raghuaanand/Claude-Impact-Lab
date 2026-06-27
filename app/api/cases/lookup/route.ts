import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

/** Public family lookup: caseRef + reporter mobile (last 10 digits). */
export async function POST(req: NextRequest) {
  let body: { caseRef?: string; mobile?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const caseRef = body.caseRef?.trim().toUpperCase();
  const mobile = body.mobile?.trim();

  if (!caseRef || !mobile) {
    return NextResponse.json(
      { error: "Case reference and mobile number are required" },
      { status: 400 }
    );
  }

  const caseRecord = await prisma.case.findUnique({
    where: { caseRef },
    include: { zone: true },
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const submitted = normalizePhone(mobile);
  const stored = caseRecord.reporterPhone
    ? normalizePhone(caseRecord.reporterPhone)
    : "";

  if (!stored || submitted !== stored) {
    return NextResponse.json(
      { error: "Mobile number does not match this case" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    case: {
      caseRef: caseRecord.caseRef,
      status: caseRecord.status,
      type: caseRecord.type,
      personName: caseRecord.personName,
      ageBand: caseRecord.ageBand,
      gender: caseRecord.gender,
      zoneName: caseRecord.zone?.name ?? null,
      lastSeenText: caseRecord.lastSeenText,
      reportingCenter: caseRecord.reportingCenter,
      reportedAt: caseRecord.reportedAt,
      resolutionHours: caseRecord.resolutionHours,
      isDuplicate: caseRecord.isDuplicate,
    },
  });
}
