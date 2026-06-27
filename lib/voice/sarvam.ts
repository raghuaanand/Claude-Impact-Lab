import { languageToBcp47 } from "@/lib/voice/languages";

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";

type SarvamSttResponse = {
  transcript?: string;
  request_id?: string;
};

type SarvamErrorBody = {
  detail?: string;
  message?: string;
  error?: string | { message?: string; code?: string };
};

export function parseSarvamError(data: unknown): string {
  if (!data || typeof data !== "object") return "Unknown transcription error";
  const body = data as SarvamErrorBody;

  if (typeof body.detail === "string" && body.detail) return body.detail;
  if (typeof body.message === "string" && body.message) return body.message;

  const err = body.error;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object" && typeof err.message === "string" && err.message) {
    return err.message;
  }

  try {
    return JSON.stringify(data);
  } catch {
    return "Unknown transcription error";
  }
}

function normalizeMimeType(mimeType: string): string {
  const base = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
  if (base.includes("webm")) return "audio/webm";
  if (base.includes("ogg")) return "audio/ogg";
  if (base.includes("wav")) return "audio/wav";
  if (base.includes("mp4") || base.includes("m4a")) return "audio/mp4";
  return base || "audio/webm";
}

function audioFilename(mimeType: string): string {
  if (mimeType.includes("ogg")) return "recording.ogg";
  if (mimeType.includes("wav")) return "recording.wav";
  if (mimeType.includes("mp4")) return "recording.m4a";
  return "recording.webm";
}

export async function transcribeWithSarvam(
  apiKey: string,
  audio: Blob,
  language: string,
): Promise<string> {
  const bytes = Buffer.from(await audio.arrayBuffer());
  if (bytes.length < 800) {
    throw new Error("no-audio");
  }

  const mimeType = normalizeMimeType(audio.type);
  const filename = audioFilename(mimeType);
  const uploadBlob = new Blob([bytes], { type: mimeType });

  const languageCode = languageToBcp47(language);
  const body = new FormData();
  body.append("file", uploadBlob, filename);
  body.append("model", "saaras:v3");
  body.append("mode", "transcribe");
  body.append("language_code", languageCode);

  const res = await fetch(SARVAM_STT_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as SarvamSttResponse & SarvamErrorBody;

  if (!res.ok) {
    const detail = parseSarvamError(data);
    if (res.status === 403) throw new Error("sarvam-forbidden");
    if (res.status === 429) throw new Error("sarvam-quota");
    throw new Error(`sarvam-error:${detail}`);
  }

  const transcript = data.transcript?.trim();
  if (!transcript) throw new Error("no-speech");
  return transcript;
}
