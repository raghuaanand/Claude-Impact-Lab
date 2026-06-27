"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SafeCase } from "@/lib/case-access";

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [caseRecord, setCaseRecord] = useState<SafeCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCaseRecord(d.case);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <MobileShell>
        <div className="p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-4 h-48 w-full" />
        </div>
        <BottomNav />
      </MobileShell>
    );
  }

  if (!caseRecord) {
    return (
      <MobileShell>
        <p className="p-8 text-center text-khummela-muted">Case not found</p>
        <BottomNav />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/dashboard" className="text-sm text-khummela-accent">
          ← Back
        </Link>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {caseRecord.personName || "Unknown"}
            </h1>
            <p className="font-mono text-sm text-khummela-muted">{caseRecord.caseRef}</p>
          </div>
          <Badge status={caseRecord.status} />
        </div>

        {caseRecord.media[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseRecord.media[0].cdnUrl}
            alt=""
            className="mt-6 aspect-video w-full rounded-2xl object-cover"
          />
        )}

        <Card className="mt-6 space-y-3 text-sm">
          <Row label="Type" value={caseRecord.type} />
          <Row label="Age" value={caseRecord.ageBand} />
          <Row label="Gender" value={caseRecord.gender} />
          <Row label="Language" value={caseRecord.language} />
          <Row label="Zone" value={caseRecord.zoneName} />
          <Row label="Last seen" value={caseRecord.lastSeenText} />
          <Row label="Center" value={caseRecord.reportingCenter} />
          <Row label="Description" value={caseRecord.physicalDescription} />
          {caseRecord.reporterPhone && (
            <Row label="Contact" value={caseRecord.reporterPhone} />
          )}
        </Card>
      </div>
      <BottomNav />
    </MobileShell>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-khummela-muted">
        {label}
      </p>
      <p className="mt-0.5 text-khummela-text">{value}</p>
    </div>
  );
}
