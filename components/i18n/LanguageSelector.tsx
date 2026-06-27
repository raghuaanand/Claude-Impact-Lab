"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { LOCALES, localeLabel, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "./LocaleProvider";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
  variant?: "compact" | "full";
};

export function LanguageSelector({ className, variant = "compact" }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pick(next: Locale) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    setSaving(true);
    await setLocale(next);
    setSaving(false);
    setOpen(false);
  }

  if (variant === "full") {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium text-khummela-text">{t("common.selectLanguage")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              disabled={saving}
              onClick={() => pick(l.code)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                locale === l.code
                  ? "border-khummela-primary bg-khummela-primary/10 font-medium text-khummela-primary"
                  : "border-khummela-border text-khummela-text hover:border-khummela-primary/40",
              )}
            >
              {l.nativeLabel}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-khummela-border bg-white px-2.5 py-1.5 text-xs font-medium text-khummela-text hover:border-khummela-primary/40"
        aria-label={t("common.changeLanguage")}
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-khummela-muted" />
        <span>{localeLabel(locale)}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t("common.cancel")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-xl border border-khummela-border bg-white py-1 shadow-lg">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                disabled={saving}
                onClick={() => pick(l.code)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-khummela-bg",
                  locale === l.code && "font-medium text-khummela-primary",
                )}
              >
                <span>{l.nativeLabel}</span>
                <span className="text-xs text-khummela-muted">{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
