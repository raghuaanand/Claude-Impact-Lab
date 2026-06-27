// Bhashini API Integration for speech-to-text and translation
// Docs: https://bhashini.gov.in/

const BHASHINI_API_URL = "https://api.bhashini.gov.in/api/v1";
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY || "";

export const SUPPORTED_LANGUAGES = {
  hi: "Hindi (हिन्दी)",
  en: "English",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  mr: "Marathi (मराठी)",
  gu: "Gujarati (ગુજરાતી)",
  bn: "Bengali (বাংলা)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
};

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}

/**
 * Transcribe audio using Bhashini
 * For MVP, returns the audio file as base64 with placeholder for Bhashini
 */
export async function transcribeAudio(
  audioBase64: string,
  language: string = "hi"
): Promise<TranscriptionResult> {
  // TODO: Implement actual Bhashini API call
  // This requires:
  // 1. BHASHINI_API_KEY in environment
  // 2. Audio processing on Bhashini side
  // 3. Return transcribed text

  if (!BHASHINI_API_KEY) {
    console.warn("Bhashini API key not configured - transcription disabled");
    return {
      text: "[Audio uploaded - transcription pending Bhashini setup]",
      language,
      confidence: 0,
    };
  }

  try {
    // Placeholder for actual Bhashini API call
    const response = await fetch(`${BHASHINI_API_URL}/speech2text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BHASHINI_API_KEY,
      },
      body: JSON.stringify({
        audio: audioBase64,
        language,
        model: "general",
      }),
    });

    if (!response.ok) {
      throw new Error("Bhashini transcription failed");
    }

    const data = await response.json();
    return {
      text: data.transcript || data.text,
      language,
      confidence: data.confidence,
    };
  } catch (err) {
    console.error("Transcription error:", err);
    throw err;
  }
}

/**
 * Translate text using Bhashini
 */
export async function translateText(
  text: string,
  sourceLang: string = "hi",
  targetLang: string = "en"
): Promise<TranslationResult> {
  if (sourceLang === targetLang) {
    return {
      original: text,
      translated: text,
      sourceLang,
      targetLang,
    };
  }

  if (!BHASHINI_API_KEY) {
    console.warn("Bhashini API key not configured - translation disabled");
    return {
      original: text,
      translated: text,
      sourceLang,
      targetLang,
    };
  }

  try {
    // Placeholder for actual Bhashini API call
    const response = await fetch(`${BHASHINI_API_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BHASHINI_API_KEY,
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error("Bhashini translation failed");
    }

    const data = await response.json();
    return {
      original: text,
      translated: data.translated || data.translatedText || text,
      sourceLang,
      targetLang,
    };
  } catch (err) {
    console.error("Translation error:", err);
    // Return original on error
    return {
      original: text,
      translated: text,
      sourceLang,
      targetLang,
    };
  }
}

/**
 * Simple language detection
 */
export function detectLanguage(text: string): string {
  // Simple heuristic: check for common scripts
  if (/[ऀ-ॿ]/.test(text)) return "hi"; // Devanagari
  if (/[஀-௿]/.test(text)) return "ta"; // Tamil
  if (/[ఀ-౿]/.test(text)) return "te"; // Telugu
  if (/[ಀ-೿]/.test(text)) return "kn"; // Kannada
  if (/[ഀ-ൿ]/.test(text)) return "ml"; // Malayalam
  return "en"; // Default to English
}
