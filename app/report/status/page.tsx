"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BottomNav } from "@/components/ui/BottomNav";

type LookupResult = {
  caseRef: string;
  status: string;
  type: string;
  personName: string | null;
  ageBand: string | null;
  gender: string | null;
  zoneName: string | null;
  lastSeenText: string | null;
  reportingCenter: string | null;
  reportedAt: string;
  resolutionHours: number | null;
  isDuplicate: boolean;
};

type MyCase = {
  id: string;
  caseRef: string;
  status: string;
  personName: string | null;
  zoneName: string | null;
  reportedAt: string;
  resolutionHours: number | null;
};

const STATUS_MESSAGES: Record<string, string> = {
  OPEN: "Your report is active. Volunteers across all centers can see it.",
  MATCH_PENDING: "A possible match was found. A supervisor is reviewing it.",
  RESOLVED: "This case has been reunified. We hope your family is together again.",
  TRANSFERRED: "The person was transferred to a hospital or medical facility.",
  UNRESOLVED: "This case remains open. Please visit the nearest Khoya-Paaya center.",
  DUPLICATE: "This may be a duplicate report. Please check with the help desk.",
};

export default function ReportStatusPage() {
  const { data: session } = useSession();
  const [caseRef, setCaseRef] = useState("");
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [myCases, setMyCases] = useState<MyCase[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFamily = session?.user?.role === "FAMILY";

  useEffect(() => {
    if (isFamily) {
      fetch("/api/cases/mine")
        .then((r) => r.json())
        .then((d) => setMyCases(d.cases ?? []))
        .catch(() => {});
    }
  }, [isFamily]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/cases/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseRef, mobile }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not find case");
      return;
    }
    setResult(data.case);
  }

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-khummela-primary text-sm font-bold text-white">
              SC
            </div>
            <span className="font-semibold">Sangam Connect</span>
          </Link>
          {session ? <SignOutButton /> : (
            <Link href="/signin" className="text-sm text-khummela-accent">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 pb-24">
        <h1 className="text-2xl font-semibold tracking-tight">Track your case</h1>
        <p className="mt-2 text-sm leading-relaxed text-khummela-muted">
          Enter the case reference you received when reporting, and the mobile number
          you provided.
        </p>

        {isFamily && myCases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-khummela-muted">
              Your reports
            </h2>
            <div className="mt-3 space-y-2">
              {myCases.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold">{c.caseRef}</p>
                    <Badge status={c.status as "OPEN"} />
                  </div>
                  <p className="mt-1 text-sm text-khummela-muted">
                    {c.personName ?? "Unknown"} · {c.zoneName}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={lookup} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="caseRef">Case reference</Label>
            <Input
              id="caseRef"
              className="mt-2 h-12 font-mono"
              placeholder="SC-M-2027-0042 or KMP-2027-00001"
              value={caseRef}
              onChange={(e) => setCaseRef(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <Label htmlFor="mobile">Your mobile number</Label>
            <Input
              id="mobile"
              className="mt-2 h-12"
              type="tel"
              placeholder="+91"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-khummela-error">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Check status
          </Button>
        </form>

        {result && (
          <Card className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-lg font-bold">{result.caseRef}</p>
              <Badge status={result.status as "OPEN"} />
            </div>
            <p className="text-sm leading-relaxed text-khummela-text">
              {STATUS_MESSAGES[result.status] ?? "Status updated."}
            </p>
            <div className="space-y-2 text-sm text-khummela-muted">
              {result.personName && <p>Name: {result.personName}</p>}
              <p>
                {result.ageBand} · {result.gender}
              </p>
              {result.zoneName && <p>Zone: {result.zoneName}</p>}
              {result.lastSeenText && <p>Last seen: {result.lastSeenText}</p>}
              {result.reportingCenter && <p>Center: {result.reportingCenter}</p>}
              {result.resolutionHours != null && (
                <p className="text-khummela-success">
                  Reunified in {result.resolutionHours.toFixed(1)} hours
                </p>
              )}
            </div>
          </Card>
        )}

        <div className="mt-10 text-center">
          <Link href="/report/missing">
            <Button variant="outline" size="lg" className="w-full">
              Report a missing person
            </Button>
          </Link>
        </div>
      </main>
      {isFamily && <BottomNav />}
    </div>
  );
}
