"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";

export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col justify-between bg-khummela-primary px-8 py-10 text-white lg:w-2/5 lg:px-12 lg:py-16">
      <div className="flex items-start justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-khummela-accent font-bold text-lg">
            K
          </div>
          <span className="text-xl font-semibold tracking-tight">
            {t("common.brandKhummela")}
          </span>
        </Link>
        <LanguageSelector className="[&_button]:border-white/30 [&_button]:bg-white/10 [&_button]:text-white" />
      </div>

      <div className="my-12 lg:my-0">
        <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
          {t("auth.togetherHope")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-white/80">
          {t("auth.authBlurb")}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white/10 p-4">
            <p className="text-2xl font-bold text-khummela-hope">{t("auth.alerts247")}</p>
            <p className="text-sm text-white/70">{t("auth.alertsLabel")}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4">
            <p className="text-2xl font-bold text-khummela-hope">{t("auth.secure")}</p>
            <p className="text-sm text-white/70">{t("auth.secureLabel")}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/50">{t("auth.footerTagline")}</p>

      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
