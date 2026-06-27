export interface VoiceIntakeProvider {
  transcribe(audio: Blob, language: string): Promise<string>;
  translate?(text: string, from: string, to: string): Promise<string>;
}

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: "hi-IN",
  English: "en-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Gujarati: "gu-IN",
};

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

export function languageToBcp47(language: string): string {
  return LANGUAGE_CODES[language] ?? "hi-IN";
}

export function voiceCaptureErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone access denied. Allow the mic in your browser settings and try again.";
    case "no-speech":
      return "No speech detected. Tap Voice and speak your description.";
    case "network":
      return "Voice recognition needs an internet connection.";
    case "not-secured":
    case "service-not-allowed":
      return "Voice input requires a secure connection (HTTPS).";
    case "aborted":
      return "";
    case "audio-capture":
      return "No microphone found. Connect a mic and try again.";
    default:
      return "Could not capture voice. Try again.";
  }
}

/** Request mic permission before Web Speech API (required by most browsers). */
export async function ensureMicrophoneAccess(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Web Speech API requires browser");
  }
  if (!window.isSecureContext) {
    throw new Error("not-secured");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("not-allowed");
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      throw new Error("not-allowed");
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      throw new Error("audio-capture");
    }
    throw err;
  }
}

/** Browser speech-to-text via Web Speech API. */
export async function listenForSpeech(language: string): Promise<string> {
  await ensureMicrophoneAccess();

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

export class ManualProvider implements VoiceIntakeProvider {
  async transcribe(): Promise<string> {
    return "";
  }
}

export function getVoiceProvider(): VoiceIntakeProvider {
  if (typeof window !== "undefined") {
    const W = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    if (W.SpeechRecognition || W.webkitSpeechRecognition) {
      return new WebSpeechProvider();
    }
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
  const garments = ["kurta", "saree", "shawl", "dhoti", "turban", "shirt"];
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
