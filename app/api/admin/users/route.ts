import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePolice } from "@/lib/api-auth";
import { roleLabel } from "@/lib/roles";

export async function GET() {
  const authResult = await requirePolice();
  if ("error" in authResult) return authResult.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      createdAt: true,
      volunteerAssignment: {
        include: { zone: { select: { id: true, name: true, code: true } } },
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      role: u.role,
      roleLabel: roleLabel(u.role),
      createdAt: u.createdAt,
      zone: u.volunteerAssignment?.zone ?? null,
    })),
  });
}
