export interface VoiceIntakeProvider {
  transcribe(audio: Blob, language: string): Promise<string>;
  translate?(text: string, from: string, to: string): Promise<string>;
}

export class WebSpeechProvider implements VoiceIntakeProvider {
  async transcribe(_audio: Blob, language: string): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Web Speech API requires browser");
    }

    const W = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    const Ctor = (W.SpeechRecognition ?? W.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
          onerror: ((e: { error: string }) => void) | null;
          start: () => void;
        })
      | undefined;

    if (!Ctor) {
      throw new Error("Speech recognition not supported in this browser");
    }

    return new Promise((resolve, reject) => {
      const recognition = new Ctor();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        resolve(transcript);
      };
      recognition.onerror = (event) => reject(new Error(event.error));
      recognition.start();
    });
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
