"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { StatCard } from "@/components/ui/StatCard";
import { CaseCard } from "@/components/ui/CaseCard";
import { MatchCompare } from "@/components/ui/MatchCompare";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SafeCase } from "@/lib/case-access";

type Analytics = {
  activeMissing: number;
  foundOpen: number;
  resolved: number;
  duplicates: number;
  avgResolutionHours: number;
  byZone: { id: string; code: string; name: string; count: number }[];
};

type MatchRow = {
  id: string;
  score: number;
  missingCase: SafeCase;
  foundCase: SafeCase;
};

export default function ManagementPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [cases, setCases] = useState<SafeCase[]>([]);
  const [zoneFilter, setZoneFilter] = useState("");

  useEffect(() => {
    fetch("/api/analytics/summary").then((r) => r.json()).then(setAnalytics);
    fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ type: "MISSING", limit: "30" });
    if (zoneFilter) params.set("zoneId", zoneFilter);
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []));
  }, [zoneFilter]);

  async function reviewMatch(id: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMatches((m) => m.filter((x) => x.id !== id));
    fetch("/api/analytics/summary").then((r) => r.json()).then(setAnalytics);
  }

  return (
    <AppShell title="Command Center" role={role} showNav={false}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text md:text-4xl">Command Center</h1>
          <p className="text-sm font-semibold text-khummela-muted leading-relaxed">Supervisor overview — all mela zones</p>
        </header>

        {analytics && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active missing" value={analytics.activeMissing} />
            <StatCard label="Found (open)" value={analytics.foundOpen} />
            <StatCard label="Resolved" value={analytics.resolved} />
            <StatCard
              label="Avg resolution"
              value={`${analytics.avgResolutionHours.toFixed(1)}h`}
            />
          </div>
        )}

        <section className="mt-12 border-t border-black/[0.05] pt-10">
          <header className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-khummela-text">Match Verification</h2>
            <p className="text-xs font-semibold text-khummela-muted">Human review required — no auto-reunification</p>
          </header>
          <div className="mt-6 space-y-10">
            {matches.length === 0 ? (
              <Card className="text-center p-12 border border-black/[0.03] bg-white rounded-3xl text-sm font-bold text-khummela-muted/60">
                No pending matches to verify
              </Card>
            ) : (
              matches.map((m) => (
                <div key={m.id} className="border-b border-black/[0.04] pb-8 last:border-b-0">
                  <MatchCompare
                    score={m.score}
                    missing={{
                      caseRef: m.missingCase.caseRef,
                      personName: m.missingCase.personName,
                      ageBand: m.missingCase.ageBand,
                      gender: m.missingCase.gender,
                      physicalDescription: m.missingCase.physicalDescription,
                      lastSeenText: m.missingCase.lastSeenText,
                      zoneName: m.missingCase.zoneName,
                      imageUrl: m.missingCase.media?.[0]?.cdnUrl,
                    }}
                    found={{
                      caseRef: m.foundCase.caseRef,
                      personName: m.foundCase.personName,
                      ageBand: m.foundCase.ageBand,
                      gender: m.foundCase.gender,
                      physicalDescription: m.foundCase.physicalDescription,
                      lastSeenText: m.foundCase.lastSeenText,
                      zoneName: m.foundCase.zoneName,
                      imageUrl: m.foundCase.media?.[0]?.cdnUrl,
                    }}
                  />
                  <div className="mt-5 flex gap-4 max-w-md mx-auto">
                    <Button
                      className="flex-1"
                      onClick={() => reviewMatch(m.id, "APPROVED")}
                    >
                      Approve reunification
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => reviewMatch(m.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-12 border-t border-black/[0.05] pt-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-khummela-text">Missing Wall</h2>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setZoneFilter("")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                  !zoneFilter ? "bg-black text-white shadow-sm" : "bg-black/[0.04] text-khummela-muted hover:bg-black/[0.08]"
                }`}
              >
                All Zones
              </button>
              {analytics?.byZone.slice(0, 8).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoneFilter(z.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                    zoneFilter === z.id ? "bg-black text-white shadow-sm" : "bg-black/[0.04] text-khummela-muted hover:bg-black/[0.08]"
                  }`}
                >
                  {z.code} ({z.count})
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
            ))}
          </div>
        </section>

        <p className="mt-12 text-center">
          <Link href="/dashboard" className="text-sm font-bold text-khummela-primary transition-colors hover:text-khummela-primary-dark">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
