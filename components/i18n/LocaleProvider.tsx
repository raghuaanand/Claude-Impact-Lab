"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/config";
import { createTranslator, type MessageKey, type TranslateFn } from "@/lib/i18n/translate";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return value && isLocale(value) ? value : null;
}

function writeCookieLocale(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

type LocaleProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const { status } = useSession();
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? readCookieLocale() ?? DEFAULT_LOCALE,
  );

  useEffect(() => {
    if (initialLocale) {
      setLocaleState(initialLocale);
      writeCookieLocale(initialLocale);
    }
  }, [initialLocale]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/locale")
      .then((r) => r.json())
      .then((data: { locale?: string }) => {
        if (data.locale && isLocale(data.locale)) {
          setLocaleState(data.locale);
          writeCookieLocale(data.locale);
        }
      })
      .catch(() => {});
  }, [status]);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    writeCookieLocale(next);
    document.documentElement.lang = next;
    await fetch("/api/user/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}

export type { MessageKey };
