import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/app/generated/prisma/client";

export type AuthUser = { id: string; role: Role };

export async function getAuthorizedUser(): Promise<
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: { id: session.user.id, role: session.user.role } };
}
