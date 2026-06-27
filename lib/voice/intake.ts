import { languageToBcp47 } from "@/lib/voice/languages";

export { languageToBcp47, REPORT_LANGUAGES } from "@/lib/voice/languages";
export { startAudioCapture, type AudioCaptureSession } from "@/lib/voice/capture";

export interface VoiceIntakeProvider {
  transcribe(audio: Blob, language: string): Promise<string>;
  translate?(text: string, from: string, to: string): Promise<string>;
}

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const W = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return W.SpeechRecognition ?? W.webkitSpeechRecognition;
}

export function voiceCaptureErrorMessage(error: string): string {
  if (error.startsWith("sarvam-error:")) {
    return `Transcription failed: ${error.slice("sarvam-error:".length)}`;
  }
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone access denied. Allow the mic in your browser settings and try again.";
    case "no-speech":
      return "No speech detected. Tap Voice, speak clearly, then tap again to finish.";
    case "network":
      return "Voice recognition needs an internet connection.";
    case "not-secured":
    case "service-not-allowed":
      return "Voice input requires a secure connection (HTTPS).";
    case "aborted":
      return "";
    case "audio-capture":
      return "No microphone found. Connect a mic and try again.";
    case "sarvam-not-configured":
      return "Voice service is not configured. Add SARVAM_API_KEY to the server environment.";
    case "sarvam-forbidden":
      return "Invalid Sarvam API key. Check SARVAM_API_KEY on the server.";
    case "sarvam-quota":
      return "Sarvam API quota exceeded. Check your Sarvam dashboard credits.";
    case "transcription-failed":
    case "no-audio":
      return "Could not transcribe voice. Try again.";
    case "audio-too-large":
      return "Recording is too long. Speak for under 30 seconds.";
    case "recording-too-short":
      return "Recording too short. Speak for at least 2 seconds, then tap to finish.";
    default:
      if (error.includes("audio format") || error.includes("Failed to read the file")) {
        return "Could not read the recording. Speak for at least 2 seconds, then tap to finish.";
      }
      return "Could not capture voice. Try again.";
  }
}

/** Send recorded audio to the server (Sarvam Saaras v3). */
export async function transcribeAudio(audio: Blob, language: string): Promise<string> {
  const ext = audio.type.includes("ogg") ? "ogg" : "webm";
  const formData = new FormData();
  formData.append("file", audio, `recording.${ext}`);
  formData.append("language", language);

  const res = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as {
    transcript?: string;
    code?: string;
    error?: string;
  };

  if (!res.ok) {
    const detail = typeof data.error === "string" && data.error ? data.error : undefined;
    throw new Error(data.code ?? detail ?? "transcription-failed");
  }

  const transcript = data.transcript?.trim();
  if (!transcript) throw new Error("no-speech");
  return transcript;
}

/** Legacy browser speech-to-text (unreliable on Chromium/Linux — prefer transcribeAudio). */
export async function listenForSpeech(language: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Web Speech API requires browser");
  }
  if (!window.isSecureContext) {
    throw new Error("not-secured");
  }

  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    throw new Error("Speech recognition not supported in this browser");
  }

  const lang = languageToBcp47(language);

  return new Promise((resolve, reject) => {
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) {
        resolve(transcript);
      } else {
        reject(new Error("no-speech"));
      }
    };
    recognition.onerror = (event) => reject(new Error(event.error));
    recognition.start();
  });
}

export class WebSpeechProvider implements VoiceIntakeProvider {
  async transcribe(_audio: Blob, language: string): Promise<string> {
    return listenForSpeech(language);
  }
}

export class SarvamProvider implements VoiceIntakeProvider {
  async transcribe(audio: Blob, language: string): Promise<string> {
    return transcribeAudio(audio, language);
  }
}

export class ManualProvider implements VoiceIntakeProvider {
  async transcribe(): Promise<string> {
    return "";
  }
}

export function getVoiceProvider(): VoiceIntakeProvider {
  if (typeof window !== "undefined") {
    return new SarvamProvider();
  }
  return new ManualProvider();
}

/** Extract descriptors from free-text (rule-based, no LLM) */
export function extractDescriptors(text: string): {
  ageBand?: string;
  gender?: string;
  clothing: string[];
  location?: string;
} {
  const lower = text.toLowerCase();
  const clothing: string[] = [];
  const colors = ["white", "saffron", "red", "green", "blue", "black", "yellow", "orange"];
  const garments = ["kurta", "saree", "shawl", "dhoti", "turban", "shirt", "mundu", "veshti"];
  for (const c of colors) {
    if (lower.includes(c)) clothing.push(c);
  }
  for (const g of garments) {
    if (lower.includes(g)) clothing.push(g);
  }

  let ageBand: string | undefined;
  const ageMatch = lower.match(/(\d{2})\s*[-–]?\s*(\d{2})?\s*(years?|yrs?|old)/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1], 10);
    if (age <= 12) ageBand = "0-12";
    else if (age <= 17) ageBand = "13-17";
    else if (age <= 40) ageBand = "18-40";
    else if (age <= 60) ageBand = "41-60";
    else if (age <= 70) ageBand = "61-70";
    else if (age <= 80) ageBand = "71-80";
    else ageBand = "80+";
  }

  let gender: string | undefined;
  if (/\b(father|man|male|boy|uncle|grandfather)\b/.test(lower)) gender = "Male";
  if (/\b(mother|woman|female|girl|aunt|grandmother)\b/.test(lower)) gender = "Female";

  let location: string | undefined;
  const locMatch = text.match(/(?:near|at|around)\s+([^,.]+)/i);
  if (locMatch) location = locMatch[1].trim();

  return { ageBand, gender, clothing, location };
}
