"use client";

import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/components/i18n/LocaleProvider";

type ReportPageHeaderProps = {
  type: "MISSING" | "FOUND";
};

export function ReportPageHeader({ type }: ReportPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-khummela-border bg-white px-4 py-4">
      <div className="mx-auto flex max-w-lg items-start justify-between gap-3">
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-khummela-text">
            {type === "MISSING" ? t("report.missingTitle") : t("report.foundTitle")}
          </h1>
          <p className="mt-1 text-sm text-khummela-muted">
            {type === "MISSING" ? t("report.missingSubtitle") : t("report.foundSubtitle")}
          </p>
        </div>
        <LanguageSelector />
      </div>
    </div>
  );
}
