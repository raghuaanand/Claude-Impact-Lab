"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { CaseCard } from "@/components/ui/CaseCard";
import { CaseCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Users, UserPlus, Shield, Info } from "lucide-react";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { SafeCase } from "@/lib/case-access";
import type { Role } from "@/app/generated/prisma/client";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = session?.user?.role ?? "VOLUNTEER";
  const [cases, setCases] = useState<SafeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/cases?${params}`);
    const data = await res.json();
    setCases(data.cases ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const isSupervisor = role === "SUPERVISOR" || role === "POLICE";

  return (
    <AppShell role={role}>
      <div className="mx-auto max-w-4xl px-6 py-10 lg:max-w-6xl">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text md:text-4xl">
            {t("dashboard.title", { role: t(`roles.${role}` as "roles.FAMILY") })}
          </h1>
          <p className="text-sm font-medium text-khummela-muted leading-relaxed max-w-xl">
            {t(`dashboard.intro.${role}` as "dashboard.intro.FAMILY")}
          </p>
        </header>

        {role === "VOLUNTEER" && (
          <Card className="mt-6 flex gap-3.5 p-5 text-xs font-semibold text-khummela-muted border border-black/[0.04] bg-white rounded-3xl">
            <Info className="h-5 w-5 shrink-0 text-khummela-primary" />
            <p className="leading-relaxed">{t("dashboard.volunteerNote")}</p>
          </Card>
        )}

        {isSupervisor && (
          <Link href="/management" className="mt-6 block group">
            <Card className="flex items-center justify-between border-black/[0.04] bg-gradient-to-r from-khummela-accent to-[#2c2c2e] p-6 text-white transition-all duration-300 rounded-[24px] hover:translate-y-[-2px] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-base tracking-tight">{t("dashboard.commandCenter")}</p>
                  <p className="text-xs text-white/70 font-semibold mt-0.5">
                    {t("dashboard.commandCenterHint")}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-colors group-hover:bg-white/20">
                {t("common.view")}
              </span>
            </Card>
          </Link>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/report/missing" className="group">
            <Card className="flex h-28 items-center gap-5 p-5 border border-blue-500/10 bg-blue-500/[0.02] transition-all duration-300 rounded-[24px] hover:translate-y-[-2px] hover:bg-blue-500/[0.04] hover:shadow-[0_12px_24px_rgba(0,113,227,0.04)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-khummela-primary/10 text-khummela-primary transition-transform duration-300 group-hover:scale-105">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base tracking-tight text-khummela-text">{t("dashboard.reportMissing")}</p>
                <p className="text-xs font-semibold text-khummela-muted mt-0.5">{t("dashboard.reportMissingHint")}</p>
              </div>
            </Card>
          </Link>
          <Link href="/report/found" className="group">
            <Card className="flex h-28 items-center gap-5 p-5 border border-emerald-500/10 bg-emerald-500/[0.02] transition-all duration-300 rounded-[24px] hover:translate-y-[-2px] hover:bg-emerald-500/[0.04] hover:shadow-[0_12px_24px_rgba(52,199,89,0.04)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-khummela-success/10 text-khummela-success transition-transform duration-300 group-hover:scale-105">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base tracking-tight text-khummela-text">{t("dashboard.reportFound")}</p>
                <p className="text-xs font-semibold text-khummela-muted mt-0.5">{t("dashboard.reportFoundHint")}</p>
              </div>
            </Card>
          </Link>
        </div>

        <section className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-khummela-text">{t("dashboard.activeCases")}</h2>
            <span className="text-xs font-bold text-khummela-muted">{t("dashboard.totalCount", { count: cases.length })}</span>
          </div>
          
          <SearchBar className="w-full" value={query} onChange={setQuery} />

          <div className="mt-4 space-y-4">
            {loading ? (
              <>
                <CaseCardSkeleton />
                <CaseCardSkeleton />
                <CaseCardSkeleton />
              </>
            ) : cases.length === 0 ? (
            <EmptyState
              title={t("dashboard.noCases")}
              description={t("dashboard.noCasesHint")}
              actionLabel={t("dashboard.reportMissingAction")}
              onAction={() => (window.location.href = "/report/missing")}
            />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {cases.map((c) => (
                  <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </AppShell>
  );
}
