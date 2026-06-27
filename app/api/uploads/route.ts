import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reportId = formData.get("reportId") as string;
    const reportType = formData.get("reportType") as "missing" | "found";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are allowed (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // If reportId provided, verify it exists and user has access
    if (reportId && reportType) {
      if (reportType === "missing") {
        const report = await prisma.missingReport.findUnique({
          where: { id: reportId },
        });
        if (!report) {
          return NextResponse.json(
            { error: "Missing report not found" },
            { status: 404 }
          );
        }
        if (report.reporterId !== user.id && user.role !== "MANAGEMENT") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        const report = await prisma.foundReport.findUnique({
          where: { id: reportId },
        });
        if (!report) {
          return NextResponse.json(
            { error: "Found report not found" },
            { status: 404 }
          );
        }
        if (report.reporterId !== user.id && user.role !== "MANAGEMENT") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create image record
    const image = await prisma.reportImage.create({
      data: {
        url: dataUrl,
        ...(reportType === "missing" && reportId ? { missingReportId: reportId } : {}),
        ...(reportType === "found" && reportId ? { foundReportId: reportId } : {}),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: image.id,
          url: image.url,
          createdAt: image.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
