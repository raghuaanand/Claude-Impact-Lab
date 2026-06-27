'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface DashboardData {
  role: 'MANAGEMENT' | 'USER';
  stats: {
    pending?: number;
    confirmed?: number;
    rejected?: number;
    openMissing?: number;
    openFound?: number;
    investigating?: number;
    myOpenMissing?: number;
    myOpenFound?: number;
    pendingMatches?: number;
    confirmedMatches?: number;
  };
  unresolvedByGender?: any[];
  unresolvedByAge?: any[];
  verificationQueue?: any[];
  recentReports?: any[];
  pendingMatches?: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-bg">
        <div className="text-khummela-muted">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const isManagement = session.user.role === 'MANAGEMENT';

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white text-sm">
              K
            </div>
            <span className="font-semibold text-khummela-text">KHUMMELA</span>
          </Link>
          <div className="flex items-center gap-4">
            {isManagement && (
              <Link
                href="/management"
                className="text-sm font-medium text-khummela-primary hover:text-khummela-primary-dark"
              >
                Management
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-khummela-text">
            Welcome, {session.user.name || session.user.email || 'Volunteer'}
          </h1>
          <p className="mt-1 text-khummela-muted">
            {isManagement ? 'Management Dashboard' : 'Volunteer Dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {isManagement ? (
            <>
              <StatCard
                label="Pending Matches"
                value={data?.stats.pending || 0}
                color="bg-yellow-50 text-yellow-700"
              />
              <StatCard
                label="Confirmed"
                value={data?.stats.confirmed || 0}
                color="bg-green-50 text-green-700"
              />
              <StatCard
                label="Open Missing"
                value={data?.stats.openMissing || 0}
                color="bg-blue-50 text-blue-700"
              />
              <StatCard
                label="Open Found"
                value={data?.stats.openFound || 0}
                color="bg-purple-50 text-purple-700"
              />
            </>
          ) : (
            <>
              <StatCard
                label="My Open Cases"
                value={(data?.stats.myOpenMissing || 0) + (data?.stats.myOpenFound || 0)}
                color="bg-blue-50 text-blue-700"
              />
              <StatCard
                label="Pending Matches"
                value={data?.stats.pendingMatches || 0}
                color="bg-yellow-50 text-yellow-700"
              />
              <StatCard
                label="Confirmed"
                value={data?.stats.confirmedMatches || 0}
                color="bg-green-50 text-green-700"
              />
            </>
          )}
        </div>

        {/* Content Grid */}
        {isManagement ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Verification Queue */}
            <div className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-khummela-text">
                Verification Queue
              </h2>
              <div className="mt-4 space-y-3">
                {data?.verificationQueue && data.verificationQueue.length > 0 ? (
                  data.verificationQueue.map((match) => (
                    <Link
                      key={match.id}
                      href={`/match-suggestions/${match.id}`}
                      className="block rounded-lg bg-khummela-surface p-4 hover:bg-gray-100"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-khummela-text">
                            {match.missingReport.personName}
                          </p>
                          <p className="text-sm text-khummela-muted">
                            Age: {match.missingReport.age || '?'} → Found: {match.foundReport.age || '?'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-khummela-primary">
                            {match.score}%
                          </p>
                          <p className="text-xs text-khummela-muted">Match</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-khummela-muted">No pending matches</p>
                )}
              </div>
            </div>

            {/* Unresolved by Gender */}
            <div className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-khummela-text">
                Unresolved by Gender
              </h2>
              <div className="mt-4 space-y-2">
                {data?.unresolvedByGender && data.unresolvedByGender.length > 0 ? (
                  data.unresolvedByGender.map((item) => (
                    <div key={item.gender} className="flex justify-between">
                      <p className="text-khummela-text capitalize">{item.gender}</p>
                      <p className="font-semibold text-khummela-primary">{item._count}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-khummela-muted">No data</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Reports */}
            <div className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-khummela-text">
                My Recent Reports
              </h2>
              <div className="mt-4 space-y-3">
                {data?.recentReports && data.recentReports.length > 0 ? (
                  data.recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports/${report.id}`}
                      className="block rounded-lg bg-khummela-surface p-4 hover:bg-gray-100"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-khummela-text">
                            {report.personName}
                          </p>
                          <p className="text-xs text-khummela-muted">
                            Age: {report.age || '?'} • {report.gender}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium rounded px-2 py-1 ${
                            report.status === 'OPEN'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-khummela-muted">No reports yet</p>
                )}
              </div>
            </div>

            {/* Pending Matches */}
            <div className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-khummela-text">
                Pending Matches
              </h2>
              <div className="mt-4 space-y-3">
                {data?.pendingMatches && data.pendingMatches.length > 0 ? (
                  data.pendingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg bg-khummela-surface p-4"
                    >
                      <p className="font-medium text-khummela-text">
                        {match.missingReport.personName}
                      </p>
                      <p className="text-sm text-khummela-muted">
                        Match Score: {match.score}%
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-khummela-muted">No pending matches</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-khummela-text">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/reports/new?type=missing"
              className="rounded-lg bg-khummela-primary px-4 py-2 text-white hover:bg-khummela-primary-dark"
            >
              Report Missing Person
            </Link>
            <Link
              href="/reports/new?type=found"
              className="rounded-lg bg-khummela-accent px-4 py-2 text-white hover:bg-khummela-accent-dark"
            >
              Report Found Person
            </Link>
            <Link
              href="/search"
              className="rounded-lg border border-khummela-primary px-4 py-2 text-khummela-primary hover:bg-khummela-surface"
            >
              Search Reports
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-6 ${color}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
