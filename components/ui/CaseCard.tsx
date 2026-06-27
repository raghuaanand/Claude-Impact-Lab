"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { SafeCase } from "@/lib/case-access";

type CaseCardProps = {
  caseRecord: SafeCase;
  href?: string;
};

function timeAgo(date: Date, t: ReturnType<typeof useTranslation>["t"]): string {
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return t("caseCard.justNow");
  if (hours < 24) return t("caseCard.hoursAgo", { hours });
  return t("caseCard.daysAgo", { days: Math.floor(hours / 24) });
}

export function CaseCard({ caseRecord, href }: CaseCardProps) {
  const { t } = useTranslation();

  const content = (
    <Card className="flex gap-4 p-4.5 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] border border-black/[0.03] bg-white active:scale-[0.98]">
      <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-black/[0.02] border border-black/[0.03]">
        {caseRecord.media[0]?.cdnUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseRecord.media[0].cdnUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-khummela-muted/60">
            {(caseRecord.personName?.[0] ?? "?").toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-base tracking-tight text-khummela-text">
              {caseRecord.personName || t("common.unknownName")}
            </p>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-khummela-muted mt-0.5">{caseRecord.caseRef}</p>
          </div>
          <Badge status={caseRecord.status} />
        </div>
        <p className="mt-2 text-xs font-semibold text-khummela-muted">
          {caseRecord.ageBand} {t("common.years")} · {caseRecord.gender}
          {caseRecord.language ? ` · ${caseRecord.language}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.03] pt-2">
          {caseRecord.zoneName && (
            <p className="flex items-center gap-1 text-xs font-bold text-khummela-primary">
              <MapPin className="h-3 w-3" />
              {caseRecord.zoneName}
            </p>
          )}
          <p className="text-[10px] font-bold text-khummela-muted/80">
            {timeAgo(caseRecord.reportedAt, t)}
            {caseRecord.reportingCenter ? ` · ${caseRecord.reportingCenter}` : ""}
          </p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
