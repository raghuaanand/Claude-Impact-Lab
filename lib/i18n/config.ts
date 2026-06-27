export const LOCALES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "khummela-locale";

export const LOCALE_CODES = LOCALES.map((l) => l.code) as Locale[];

export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

/** Map case/report language names to UI locale codes. */
export const REPORT_LANGUAGE_TO_LOCALE: Record<string, Locale> = {
  English: "en",
  Hindi: "hi",
  Marathi: "mr",
  Bengali: "bn",
  Tamil: "ta",
  Telugu: "te",
  Gujarati: "gu",
  Malayalam: "ml",
};

export function localeToReportLanguage(locale: Locale): string {
  const entry = Object.entries(REPORT_LANGUAGE_TO_LOCALE).find(([, code]) => code === locale);
  return entry?.[0] ?? "English";
}

export function localeLabel(locale: Locale): string {
  return LOCALES.find((l) => l.code === locale)?.nativeLabel ?? locale;
}
