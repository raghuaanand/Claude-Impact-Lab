import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeMobile } from "@/lib/mobile";

/** Cases linked to the logged-in family member (by reporterId or mobile). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "FAMILY") {
    return NextResponse.json({ error: "Family role required" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mobile: true },
  });

  const orConditions: { reporterId?: string; reporterPhone?: { contains: string } }[] = [
    { reporterId: session.user.id },
  ];

  if (user?.mobile) {
    const digits = normalizeMobile(user.mobile).replace(/\D/g, "").slice(-10);
    orConditions.push({ reporterPhone: { contains: digits } });
  }

  const cases = await prisma.case.findMany({
    where: { OR: orConditions },
    include: { zone: true },
    orderBy: { reportedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    cases: cases.map((c) => ({
      id: c.id,
      caseRef: c.caseRef,
      status: c.status,
      type: c.type,
      personName: c.personName,
      zoneName: c.zone?.name ?? null,
      reportedAt: c.reportedAt,
      resolutionHours: c.resolutionHours,
    })),
  });
}
