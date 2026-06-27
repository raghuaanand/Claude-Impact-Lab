"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
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
    <MobileShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Command Center</h1>
        <p className="mt-1 text-khummela-muted">Supervisor overview — all zones</p>

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

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Match verification</h2>
          <p className="text-sm text-khummela-muted">Human review required — no auto-reunification</p>
          <div className="mt-6 space-y-8">
            {matches.length === 0 ? (
              <Card className="py-10 text-center text-sm text-khummela-muted">
                <p className="font-medium text-khummela-text">No pending matches</p>
                <p className="mt-1">AI-suggested matches will appear here for your review.</p>
              </Card>
            ) : (
              matches.map((m) => (
                <div key={m.id}>
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
                  <div className="mt-4 flex gap-3">
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

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Missing Wall</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setZoneFilter("")}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-accent focus-visible:ring-offset-1 ${
                  !zoneFilter ? "bg-khummela-primary text-white" : "bg-khummela-surface text-khummela-muted hover:text-khummela-text"
                }`}
              >
                All zones
              </button>
              {analytics?.byZone.slice(0, 8).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoneFilter(z.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-accent focus-visible:ring-offset-1 ${
                    zoneFilter === z.id ? "bg-khummela-primary text-white" : "bg-khummela-surface text-khummela-muted hover:text-khummela-text"
                  }`}
                >
                  {z.code} ({z.count})
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
            ))}
          </div>
        </section>

        <p className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-khummela-accent">
            ← Volunteer dashboard
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}
