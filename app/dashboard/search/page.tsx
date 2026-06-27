"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { CaseCard } from "@/components/ui/CaseCard";
import { CaseCardSkeleton } from "@/components/ui/Skeleton";
import type { SafeCase } from "@/lib/case-access";

export default function SearchPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [cases, setCases] = useState<SafeCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCases([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/cases?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCases(data.cases ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  return (
    <AppShell role={role}>
      <div className="mx-auto max-w-4xl px-6 py-10 lg:max-w-6xl">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text md:text-4xl">Search Mela Centers</h1>
          <p className="text-sm font-semibold text-khummela-muted leading-relaxed max-w-xl">
            The core reunification directory — search across all zones instantly.
          </p>
        </header>

        <SearchBar className="mt-8" value={query} onChange={setQuery} />

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <CaseCardSkeleton />
              <CaseCardSkeleton />
            </div>
          ) : cases.length === 0 && query.trim() ? (
            <div className="text-center p-12 border border-black/[0.03] bg-white rounded-3xl text-sm font-semibold text-khummela-muted/65">
              No matching records found
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cases.map((c) => (
                <CaseCard key={c.id} caseRecord={c} href={`/dashboard/cases/${c.id}`} />
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </AppShell>
  );
}
