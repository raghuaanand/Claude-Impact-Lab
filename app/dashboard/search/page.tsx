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
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-semibold">Search all centers</h1>
        <p className="mt-1 text-sm text-khummela-muted">
          The core reunification feature — search everywhere at once
        </p>
        <SearchBar className="mt-6" value={query} onChange={setQuery} />
        <div className="mt-6 space-y-3">
          {loading ? (
            <CaseCardSkeleton />
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
