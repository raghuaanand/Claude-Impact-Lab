export const REPORT_LANGUAGES = [
  "Hindi",
  "English",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Malayalam",
] as const;

export type ReportLanguage = (typeof REPORT_LANGUAGES)[number];

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: "hi-IN",
  English: "en-IN",
  Marathi: "mr-IN",
  Bengali: "bn-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Gujarati: "gu-IN",
  Malayalam: "ml-IN",
};

export function languageToBcp47(language: string): string {
  return LANGUAGE_CODES[language] ?? "hi-IN";
}
