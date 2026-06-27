"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SafeCase } from "@/lib/case-access";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const role = session?.user?.role;
  const isSupervisor = role === "SUPERVISOR" || role === "POLICE";

  const [caseRecord, setCaseRecord] = useState<SafeCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function reload() {
    return fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => setCaseRecord(d.case));
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [id]);

  async function recomputeMatches() {
    setBusy(true);
    setActionMsg("");
    const res = await fetch("/api/matches/recompute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foundCaseId: id }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setActionMsg(
        data.matches?.length
          ? `Found ${data.matches.length} possible match(es). Check Command center.`
          : "No matches above threshold. Try adding more description details."
      );
      reload();
    } else {
      setActionMsg(data.error ?? "Recompute failed");
    }
  }

  async function markResolved() {
    if (!confirm("Mark this case as resolved without a match? Use only if reunification already happened on the ground.")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setBusy(false);
    if (res.ok) {
      setActionMsg("Case marked resolved");
      reload();
    } else {
      const data = await res.json();
      setActionMsg(data.error ?? "Could not resolve");
    }
  }

  if (loading) {
    return (
      <AppShell role={role}>
        <div className="p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-4 h-48 w-full" />
        </div>
        <BottomNav />
      </AppShell>
    );
  }

  if (!caseRecord) {
    return (
      <AppShell role={role}>
        <p className="p-8 text-center text-khummela-muted">Case not found</p>
        <BottomNav />
      </AppShell>
    );
  }

  return (
    <AppShell role={role}>
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
          {caseRecord.remarks && isSupervisor && (
            <Row label="Remarks" value={caseRecord.remarks} />
          )}
        </Card>

        {actionMsg && (
          <p className="mt-4 text-sm text-khummela-accent">{actionMsg}</p>
        )}

        <div className="mt-6 space-y-3">
          {caseRecord.type === "FOUND" &&
            ["OPEN", "MATCH_PENDING"].includes(caseRecord.status) && (
              <Button
                className="w-full"
                size="lg"
                variant="secondary"
                loading={busy}
                onClick={recomputeMatches}
              >
                Run match search again
              </Button>
            )}

          {caseRecord.status === "MATCH_PENDING" && isSupervisor && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/management")}
            >
              Review matches in Command center
            </Button>
          )}

          {isSupervisor &&
            !["RESOLVED", "DUPLICATE"].includes(caseRecord.status) && (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                loading={busy}
                onClick={markResolved}
              >
                Mark as resolved (manual)
              </Button>
            )}
        </div>
      </div>
      <BottomNav />
    </AppShell>
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
