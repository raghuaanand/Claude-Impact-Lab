import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupervisor } from "@/lib/api-auth";
import { redactCase } from "@/lib/case-access";

export async function GET() {
  const authResult = await requireSupervisor();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const matches = await prisma.match.findMany({
    where: { status: "SUGGESTED" },
    include: {
      missingCase: { include: { zone: true, media: true } },
      foundCase: { include: { zone: true, media: true } },
    },
    orderBy: { score: "desc" },
    take: 50,
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      score: m.score,
      status: m.status,
      missingCase: redactCase(m.missingCase, session.user.role),
      foundCase: redactCase(m.foundCase, session.user.role),
    })),
  });
}
