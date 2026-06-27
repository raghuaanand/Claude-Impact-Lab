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
import { roleLabel } from "@/lib/roles";
import type { SafeCase } from "@/lib/case-access";
import type { Role } from "@/app/generated/prisma/client";

const ROLE_INTROS: Record<Role, string> = {
  FAMILY: "Track your reports and get reunification updates.",
  VOLUNTEER: "Register cases and search across all centers in your zone.",
  SUPERVISOR: "Coordinate searches, verify matches, and resolve reunifications.",
  POLICE: "Full oversight — command center, admin, and all case data.",
};

export default function DashboardPage() {
  const { data: session } = useSession();
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
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight text-khummela-text">
          {roleLabel(role)} dashboard
        </h1>
        <p className="mt-1 text-sm text-khummela-muted">{ROLE_INTROS[role]}</p>

        {role === "VOLUNTEER" && (
          <Card className="mt-4 flex gap-3 p-4 text-sm text-khummela-muted">
            <Info className="h-5 w-5 shrink-0 text-khummela-accent" />
            <p>
              You see cases in your assigned zone by default. Use search to find
              cases across all centers. Reporter contact is hidden — ask a supervisor
              if reunification is needed.
            </p>
          </Card>
        )}

        {isSupervisor && (
          <Link href="/management" className="mt-4 block">
            <Card className="flex items-center gap-4 border-khummela-primary/20 bg-khummela-primary/5 p-4 transition-shadow hover:shadow-md">
              <Shield className="h-8 w-8 text-khummela-primary" />
              <div>
                <p className="font-semibold text-khummela-primary">Command center</p>
                <p className="text-xs text-khummela-muted">
                  Approve matches · resolve reunifications · zone KPIs
                </p>
              </div>
            </Card>
          </Link>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/report/missing">
            <Card className="flex h-24 items-center gap-4 p-4 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-khummela-primary/10 text-khummela-primary">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Report Missing</p>
                <p className="text-xs text-khummela-muted">New missing person</p>
              </div>
            </Card>
          </Link>
          <Link href="/report/found">
            <Card className="flex h-24 items-center gap-4 p-4 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-khummela-accent/10 text-khummela-accent">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Report Found</p>
                <p className="text-xs text-khummela-muted">Register &amp; match</p>
              </div>
            </Card>
          </Link>
        </div>

        <SearchBar className="mt-6" value={query} onChange={setQuery} />

        <div className="mt-6 space-y-3">
          {loading ? (
            <>
              <CaseCardSkeleton />
              <CaseCardSkeleton />
              <CaseCardSkeleton />
            </>
          ) : cases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="Try a different search or report a new case to get started."
              actionLabel="Report missing"
              onAction={() => (window.location.href = "/report/missing")}
            />
          ) : (
            cases.map((c) => (
              <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </AppShell>
  );
}
