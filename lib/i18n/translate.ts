import type { Locale } from "./config";
import { DEFAULT_LOCALE } from "./config";
import { getMessages, type Messages } from "./messages";

type NestedKeyOf<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : {
      [K in keyof T & string]: NestedKeyOf<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type MessageKey = NestedKeyOf<Messages>;

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export function createTranslator(locale: Locale): TranslateFn {
  const messages = getMessages(locale);
  const fallback = getMessages(DEFAULT_LOCALE);

  return (key, params) => {
    let text = getNestedValue(messages as unknown as Record<string, unknown>, key);
    if (!text) {
      text = getNestedValue(fallback as unknown as Record<string, unknown>, key);
    }
    if (!text) return key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

export function roleLabelFromMessages(locale: Locale, role: keyof Messages["roles"]): string {
  return getMessages(locale).roles[role];
}
