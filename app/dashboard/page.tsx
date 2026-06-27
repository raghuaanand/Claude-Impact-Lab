"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { CaseCard } from "@/components/ui/CaseCard";
import { CaseCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Users, UserPlus } from "lucide-react";
import type { SafeCase } from "@/lib/case-access";

export default function DashboardPage() {
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

  return (
    <MobileShell managementLink>
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight text-khummela-text">
          Volunteer dashboard
        </h1>
        <p className="mt-1 text-sm text-khummela-muted">
          Cross-center search — every case, every zone
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/report/missing">
            <Card className="flex min-h-[6rem] items-center gap-4 p-4 transition-shadow hover:shadow-md">
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
            <Card className="flex min-h-[6rem] items-center gap-4 p-4 transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-khummela-accent/10 text-khummela-accent">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Report Found</p>
                <p className="text-xs text-khummela-muted">Register & match</p>
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
              description="Try a different search term, or report a new missing person to get started."
              actionLabel="Report missing person"
              href="/report/missing"
            />
          ) : (
            cases.map((c) => (
              <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </MobileShell>
  );
}
