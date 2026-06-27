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
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/components/i18n/LocaleProvider";

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

const STATUS_KEYS = {
  OPEN: "status.statuses.OPEN",
  MATCH_PENDING: "status.statuses.MATCH_PENDING",
  RESOLVED: "status.statuses.RESOLVED",
  TRANSFERRED: "status.statuses.TRANSFERRED",
  UNRESOLVED: "status.statuses.UNRESOLVED",
  DUPLICATE: "status.statuses.DUPLICATE",
} as const;

export default function ReportStatusPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
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
      setError(data.error ?? t("status.notFound"));
      return;
    }
    setResult(data.case);
  }

  return (
    <div className="min-h-full bg-khummela-bg pb-12">
      <header className="sticky top-0 z-40 apple-glass">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white shadow-sm">
              SC
            </div>
            <span className="font-semibold tracking-tight text-khummela-text text-base">{t("common.appName")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {session ? (
              <SignOutButton />
            ) : (
              <Link href="/signin" className="text-sm font-medium text-khummela-primary transition-colors hover:text-khummela-primary-dark">
                {t("common.signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-10 pb-28">
        <header className="space-y-1 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text">{t("status.title")}</h1>
          <p className="text-sm font-semibold text-khummela-muted leading-relaxed">
            {t("status.subtitle")}
          </p>
        </header>

        {isFamily && myCases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-khummela-muted">
              {t("status.myReports")}
            </h2>
            <div className="mt-3 space-y-3">
              {myCases.map((c) => (
                <Card key={c.id} className="p-5 border border-black/[0.03] bg-white">
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-khummela-text">{c.caseRef}</p>
                    <Badge status={c.status as "OPEN"} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-khummela-muted">
                    {c.personName ?? "Unknown Name"} · {c.zoneName || "Main Arena"}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={lookup} className="mt-8 space-y-5 bg-white border border-black/[0.03] p-6 rounded-[24px] shadow-[0_6px_20px_rgba(0,0,0,0.015)]">
          <div>
            <Label htmlFor="caseRef">{t("status.caseRef")}</Label>
            <Input
              id="caseRef"
              className="mt-2 h-11 font-mono uppercase"
              placeholder="e.g. SC-M-2027-0042"
              value={caseRef}
              onChange={(e) => setCaseRef(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <Label htmlFor="mobile">{t("status.mobile")}</Label>
            <Input
              id="mobile"
              className="mt-2 h-11"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-xl bg-rose-500/[0.08] border border-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}
          <Button type="submit" size="md" className="w-full" loading={loading}>
            {t("status.lookup")}
          </Button>
        </form>

        {result && (
          <Card className="mt-8 p-6 border border-black/[0.03] bg-white rounded-[24px] space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-base font-bold text-khummela-text">{result.caseRef}</p>
              <Badge status={result.status as "OPEN"} />
            </div>
            <div className="rounded-2xl bg-black/[0.02] p-4 text-xs font-semibold text-khummela-text leading-relaxed">
              {STATUS_KEYS[result.status as keyof typeof STATUS_KEYS]
                ? t(STATUS_KEYS[result.status as keyof typeof STATUS_KEYS] as "status.statuses.OPEN")
                : t("status.statusLabel")}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-khummela-muted pt-2">
              {result.personName && (
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Person Name</span>
                  <span className="text-khummela-text text-sm font-bold block mt-0.5">{result.personName}</span>
                </div>
              )}
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Demographics</span>
                <span className="text-khummela-text text-sm font-bold block mt-0.5">{result.ageBand} yrs · {result.gender}</span>
              </div>
              {result.zoneName && (
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Mela Zone</span>
                  <span className="text-khummela-text text-sm font-bold block mt-0.5">{result.zoneName}</span>
                </div>
              )}
              {result.lastSeenText && (
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">Last Seen</span>
                  <span className="text-khummela-text text-sm font-bold block mt-0.5 truncate">{result.lastSeenText}</span>
                </div>
              )}
            </div>
            
            {result.resolutionHours != null && (
              <div className="mt-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-600">
                Reunified in {result.resolutionHours.toFixed(1)} hours
              </div>
            )}
          </Card>
        )}

        <div className="mt-10">
          <Link href="/report/missing">
            <Button variant="outline" size="md" className="w-full">
              {t("home.reportMissing")}
            </Button>
          </Link>
        </div>
      </main>
      {isFamily && <BottomNav />}
    </div>
  );
}
