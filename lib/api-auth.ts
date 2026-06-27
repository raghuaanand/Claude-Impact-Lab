import { auth } from "@/lib/auth";
import type { Role } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export function requireRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function requireStaff() {
  const result = await requireAuth();
  if ("error" in result) return result;
  const role = result.session.user.role;
  if (!["VOLUNTEER", "SUPERVISOR", "POLICE"].includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}

export async function requireSupervisor() {
  const result = await requireAuth();
  if ("error" in result) return result;
  const role = result.session.user.role;
  if (!["SUPERVISOR", "POLICE"].includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
