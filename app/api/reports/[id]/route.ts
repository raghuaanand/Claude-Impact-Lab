import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";
import type { Gender, ReportStatus } from "@/app/generated/prisma/client";

const GENDERS = new Set<string>(["MALE", "FEMALE", "OTHER", "UNKNOWN"]);
const STATUSES = new Set<string>(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);

type Params = { params: Promise<{ id: string }> };

async function findReport(id: string) {
  const missing = await prisma.missingReport.findUnique({
    where: { id },
    include: { location: true },
  });
  if (missing) return { report: missing, reportType: "missing" as const };

  const found = await prisma.foundReport.findUnique({
    where: { id },
    include: { location: true },
  });
  if (found) return { report: found, reportType: "found" as const };

  return null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const { id } = await params;
  const result = await findReport(id);
  if (!result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { report, reportType } = result;
  if (user.role !== "MANAGEMENT" && report.reporterId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: { ...report, reportType } });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const { id } = await params;
  const result = await findReport(id);
  if (!result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { report, reportType } = result;
  const isManagement = user.role === "MANAGEMENT";

  if (!isManagement && report.reporterId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  if (b.status !== undefined) {
    if (!isManagement) {
      return NextResponse.json({ error: "Only MANAGEMENT can change report status" }, { status: 403 });
    }
    if (!STATUSES.has(b.status as string)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
  }

  let locationId: string | null | undefined = undefined; // undefined = no change
  if (b.location !== undefined) {
    if (b.location === null) {
      locationId = null;
    } else if (typeof b.location === "object") {
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
    } else {
      return NextResponse.json({ error: "location must be an object or null" }, { status: 400 });
    }
  }

  const commonFields = {
    ...(b.age !== undefined ? { age: b.age as number } : {}),
    ...(b.gender !== undefined ? { gender: b.gender as Gender } : {}),
    ...(b.description !== undefined ? { description: b.description as string | null } : {}),
    ...(b.status !== undefined ? { status: b.status as ReportStatus } : {}),
    ...(b.contactName !== undefined ? { contactName: b.contactName as string | null } : {}),
    ...(b.contactPhone !== undefined ? { contactPhone: b.contactPhone as string | null } : {}),
    ...(b.contactEmail !== undefined ? { contactEmail: b.contactEmail as string | null } : {}),
    ...(locationId !== undefined ? { locationId } : {}),
  };

  let updated;
  if (reportType === "missing") {
    updated = await prisma.missingReport.update({
      where: { id },
      data: {
        ...commonFields,
        ...(b.personName !== undefined ? { personName: (b.personName as string).trim() } : {}),
        ...(b.lastSeenAt !== undefined
          ? { lastSeenAt: b.lastSeenAt ? new Date(b.lastSeenAt as string) : null }
          : {}),
      },
      include: { location: true },
    });
  } else {
    updated = await prisma.foundReport.update({
      where: { id },
      data: {
        ...commonFields,
        ...(b.foundAt !== undefined
          ? { foundAt: b.foundAt ? new Date(b.foundAt as string) : null }
          : {}),
      },
      include: { location: true },
    });
  }

  const auditAction = b.status !== undefined ? "STATUS_CHANGED" : "UPDATED";
  const auditMeta =
    auditAction === "STATUS_CHANGED"
      ? { from: report.status, to: b.status }
      : { fields: Object.keys(b) };

  await createAuditLog({
    userId: user.id,
    action: auditAction,
    entityType: reportType === "missing" ? "MISSING_REPORT" : "FOUND_REPORT",
    entityId: id,
    ...(reportType === "missing" ? { missingReportId: id } : { foundReportId: id }),
    metadata: auditMeta,
  });

  return NextResponse.json({ data: { ...updated, reportType } });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  if (user.role !== "MANAGEMENT") {
    return NextResponse.json({ error: "Forbidden: only MANAGEMENT can delete reports" }, { status: 403 });
  }

  const { id } = await params;
  const result = await findReport(id);
  if (!result) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { reportType } = result;

  // Write audit log before deletion so FK references are still valid.
  await createAuditLog({
    userId: user.id,
    action: "DELETED",
    entityType: reportType === "missing" ? "MISSING_REPORT" : "FOUND_REPORT",
    entityId: id,
    ...(reportType === "missing" ? { missingReportId: id } : { foundReportId: id }),
    metadata: { reportType },
  });

  if (reportType === "missing") {
    await prisma.missingReport.delete({ where: { id } });
  } else {
    await prisma.foundReport.delete({ where: { id } });
  }

  return NextResponse.json({ data: { id, deleted: true } });
}
