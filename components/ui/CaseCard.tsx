import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import type { SafeCase } from "@/lib/case-access";

type CaseCardProps = {
  caseRecord: SafeCase;
  href?: string;
};

function timeAgo(date: Date): string {
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CaseCard({ caseRecord, href }: CaseCardProps) {
  const content = (
    <Card className="flex gap-4 p-4 transition-shadow hover:shadow-md active:scale-[0.99]">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-khummela-surface">
        {caseRecord.media[0]?.cdnUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseRecord.media[0].cdnUrl}
            alt={caseRecord.personName ? `Photo of ${caseRecord.personName}` : "Case photo"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-semibold text-khummela-muted">
            {(caseRecord.personName?.[0] ?? "?").toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-khummela-text">
              {caseRecord.personName || "Unknown name"}
            </p>
            <p className="font-mono text-xs text-khummela-muted">{caseRecord.caseRef}</p>
          </div>
          <Badge status={caseRecord.status} />
        </div>
        <p className="mt-2 text-sm text-khummela-muted">
          {caseRecord.ageBand} · {caseRecord.gender}
          {caseRecord.language ? ` · ${caseRecord.language}` : ""}
        </p>
        {caseRecord.zoneName && (
          <p className="mt-1 flex items-center gap-1 text-sm text-khummela-accent">
            <MapPin className="h-3.5 w-3.5" />
            {caseRecord.zoneName}
          </p>
        )}
        <p className="mt-1 text-xs text-khummela-muted">
          {timeAgo(caseRecord.reportedAt)}
          {caseRecord.reportingCenter ? ` · ${caseRecord.reportingCenter}` : ""}
        </p>
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
