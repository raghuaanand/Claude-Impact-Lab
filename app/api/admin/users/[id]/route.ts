import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePolice } from "@/lib/api-auth";
import { z } from "zod";
import type { Role } from "@/app/generated/prisma/client";

const updateUserSchema = z.object({
  role: z.enum(["FAMILY", "VOLUNTEER", "SUPERVISOR", "POLICE"]).optional(),
  zoneId: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requirePolice();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { role, zoneId } = parsed.data;

  if (role) {
    await prisma.user.update({
      where: { id },
      data: { role: role as Role },
    });

    if (role !== "VOLUNTEER") {
      await prisma.volunteerAssignment.deleteMany({ where: { userId: id } });
    }
  }

  if (zoneId !== undefined) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveRole = role ?? user.role;
    if (effectiveRole !== "VOLUNTEER") {
      return NextResponse.json(
        { error: "Zone assignment only applies to volunteers" },
        { status: 400 }
      );
    }

    if (zoneId === null) {
      await prisma.volunteerAssignment.deleteMany({ where: { userId: id } });
    } else {
      await prisma.volunteerAssignment.upsert({
        where: { userId: id },
        create: { userId: id, zoneId },
        update: { zoneId },
      });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    include: {
      volunteerAssignment: { include: { zone: true } },
    },
  });

  return NextResponse.json({ user: updated });
}
