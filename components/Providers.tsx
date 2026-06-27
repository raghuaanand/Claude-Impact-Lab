"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/config";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </SessionProvider>
  );
}
