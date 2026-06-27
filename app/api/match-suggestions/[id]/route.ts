import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const { id } = await params;

  const suggestion = await prisma.matchSuggestion.findUnique({
    where: { id },
    include: {
      missingReport: { include: { location: true } },
      foundReport: { include: { location: true } },
      suggestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Match suggestion not found" }, { status: 404 });
  }

  const isManagement = user.role === "MANAGEMENT";
  const isOwner =
    suggestion.missingReport.reporterId === user.id ||
    suggestion.foundReport.reporterId === user.id;

  if (!isManagement && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: suggestion });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  const isManagement = user.role === "MANAGEMENT";
  if (!isManagement) {
    return NextResponse.json(
      { error: "Only MANAGEMENT can review match suggestions" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const suggestion = await prisma.matchSuggestion.findUnique({
    where: { id },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Match suggestion not found" }, { status: 404 });
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

  if (!b.status || !["CONFIRMED", "REJECTED"].includes(b.status as string)) {
    return NextResponse.json(
      { error: "status must be CONFIRMED or REJECTED" },
      { status: 400 }
    );
  }

  const newStatus = b.status as "CONFIRMED" | "REJECTED";
  const notes = b.notes ? (b.notes as string).trim() : null;

  // Update match suggestion
  const updated = await prisma.matchSuggestion.update({
    where: { id },
    data: {
      status: newStatus,
      reviewedById: user.id,
      reviewedAt: new Date(),
      ...(notes ? { notes } : {}),
    },
    include: {
      missingReport: { include: { location: true } },
      foundReport: { include: { location: true } },
      suggestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // If confirmed, update report statuses to RESOLVED and schedule PII deletion
  if (newStatus === "CONFIRMED") {
    await Promise.all([
      prisma.missingReport.update({
        where: { id: suggestion.missingReportId },
        data: { status: "RESOLVED" },
      }),
      prisma.foundReport.update({
        where: { id: suggestion.foundReportId },
        data: { status: "RESOLVED" },
      }),
    ]);
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: newStatus === "CONFIRMED" ? "MATCH_CONFIRMED" : "MATCH_REJECTED",
    entityType: "MATCH_SUGGESTION",
    entityId: id,
    metadata: {
      status: newStatus,
      notes,
      missingReportId: suggestion.missingReportId,
      foundReportId: suggestion.foundReportId,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  if (user.role !== "MANAGEMENT") {
    return NextResponse.json({ error: "Forbidden: only MANAGEMENT can delete" }, { status: 403 });
  }

  const { id } = await params;

  const suggestion = await prisma.matchSuggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Match suggestion not found" }, { status: 404 });
  }

  await prisma.matchSuggestion.delete({ where: { id } });

  await createAuditLog({
    userId: user.id,
    action: "DELETED",
    entityType: "MATCH_SUGGESTION",
    entityId: id,
  });

  return NextResponse.json({ data: { id, deleted: true } });
}
