import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/api-auth";

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm"];

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthorizedUser();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "hi"; // Default to Hindi
    const reportId = formData.get("reportId") as string;
    const reportType = formData.get("reportType") as "missing" | "found";

    if (!file) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only audio files are allowed (MP3, WAV, MP4, WebM)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_AUDIO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Verify report exists if reportId provided
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
      }
    }

    // Convert audio to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // For MVP: Store the audio without transcription
    // TODO: Integrate with Bhashini API for speech-to-text and translation
    // Environment variable: BHASHINI_API_KEY
    const transcript = null; // Will be populated by Bhashini integration
    const translatedText = null; // Will be populated by Bhashini integration

    // Create audio record
    const audio = await prisma.reportAudio.create({
      data: {
        url: dataUrl,
        durationSeconds: null, // Could parse from metadata
        ...(reportType === "missing" && reportId ? { missingReportId: reportId } : {}),
        ...(reportType === "found" && reportId ? { foundReportId: reportId } : {}),
      },
    });

    return NextResponse.json(
      {
        data: {
          id: audio.id,
          url: audio.url,
          durationSeconds: audio.durationSeconds,
          createdAt: audio.createdAt,
          transcript, // null for MVP
          translatedText, // null for MVP
          language,
          note: "Bhashini integration pending - audio stored for later transcription",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[transcribe] Error:", err);
    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}
