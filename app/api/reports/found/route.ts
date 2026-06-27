import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import type { Gender } from "@/app/generated/prisma/client";

const GENDERS = new Set<string>(["MALE", "FEMALE", "OTHER", "UNKNOWN"]);

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (b.age !== undefined && (typeof b.age !== "number" || b.age < 0 || b.age > 150)) {
    return NextResponse.json({ error: "age must be a number between 0 and 150" }, { status: 400 });
  }

  if (b.gender !== undefined && !GENDERS.has(b.gender as string)) {
    return NextResponse.json({ error: "gender must be MALE, FEMALE, OTHER, or UNKNOWN" }, { status: 400 });
  }

  let locationId: string | null = null;
  if (b.location !== undefined) {
    if (typeof b.location !== "object" || b.location === null) {
      return NextResponse.json({ error: "location must be an object" }, { status: 400 });
    }
    const loc = b.location as Record<string, unknown>;
    const created = await prisma.location.create({
      data: {
        latitude: typeof loc.latitude === "number" ? loc.latitude : null,
        longitude: typeof loc.longitude === "number" ? loc.longitude : null,
        address: typeof loc.address === "string" ? loc.address : null,
        city: typeof loc.city === "string" ? loc.city : null,
        state: typeof loc.state === "string" ? loc.state : null,
        country: typeof loc.country === "string" ? loc.country : null,
        postalCode: typeof loc.postalCode === "string" ? loc.postalCode : null,
      },
    });
    locationId = created.id;
  }

  const report = await prisma.foundReport.create({
    data: {
      reporterId: user.id,
      age: typeof b.age === "number" ? b.age : null,
      gender: GENDERS.has(b.gender as string) ? (b.gender as Gender) : "UNKNOWN",
      description: typeof b.description === "string" ? b.description.trim() : null,
      foundAt: typeof b.foundAt === "string" ? new Date(b.foundAt) : null,
      locationId,
      contactName: typeof b.contactName === "string" ? b.contactName.trim() : null,
      contactPhone: typeof b.contactPhone === "string" ? b.contactPhone.trim() : null,
      contactEmail: typeof b.contactEmail === "string" ? b.contactEmail.trim() : null,
    },
    include: { location: true },
  });

  return NextResponse.json({ data: { ...report, reportType: "found" } }, { status: 201 });
}
