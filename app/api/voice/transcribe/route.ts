import { NextResponse } from "next/server";
import { parseSarvamError, transcribeWithSarvam } from "@/lib/voice/sarvam";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SARVAM_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Voice transcription is not configured. Set SARVAM_API_KEY on the server.",
          code: "sarvam-not-configured",
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const language = String(formData.get("language") ?? "Hindi");

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: "No audio recording provided", code: "no-audio" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Recording is too large. Keep it under 30 seconds.", code: "audio-too-large" },
        { status: 400 },
      );
    }

    const transcript = await transcribeWithSarvam(apiKey, file, language);
    return NextResponse.json({ transcript });
  } catch (error) {
    const message = error instanceof Error ? error.message : "transcription-failed";
    console.error("Voice transcribe error:", message);

    if (message.startsWith("sarvam-error:")) {
      const detail = message.slice("sarvam-error:".length);
      return NextResponse.json({ error: detail, code: message }, { status: 502 });
    }

    return NextResponse.json({ error: message, code: message }, { status: 500 });
  }
}
