'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useEffect, useState } from 'react';

interface DashboardData {
  stats: {
    pending: number;
    confirmed: number;
    rejected: number;
    openMissing: number;
    openFound: number;
    investigating: number;
  };
  unresolvedByGender?: any[];
  verificationQueue?: any[];
}

export default function ManagementPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'queue' | 'cases' | 'analytics'>('queue');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    if (session?.user?.role !== 'MANAGEMENT') {
      redirect('/dashboard');
    }

    if (status === 'authenticated') {
      loadDashboard();
    }
  }, [status, session]);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
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

  if (!session?.user || session.user.role !== 'MANAGEMENT') {
    return null;
  }

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white text-sm">
              K
            </div>
            <span className="font-semibold text-khummela-text">KHUMMELA</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-khummela-text">Management Console</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-khummela-text">Management Dashboard</h1>
          <p className="mt-1 text-khummela-muted">
            Verify matches, manage reports, and monitor system activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Pending Matches" value={data?.stats.pending || 0} color="bg-yellow-50 text-yellow-700" />
          <StatCard label="Confirmed" value={data?.stats.confirmed || 0} color="bg-green-50 text-green-700" />
          <StatCard label="Rejected" value={data?.stats.rejected || 0} color="bg-red-50 text-red-700" />
          <StatCard label="Open Missing" value={data?.stats.openMissing || 0} color="bg-blue-50 text-blue-700" />
          <StatCard label="Open Found" value={data?.stats.openFound || 0} color="bg-purple-50 text-purple-700" />
          <StatCard label="Investigating" value={data?.stats.investigating || 0} color="bg-orange-50 text-orange-700" />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-khummela-border">
          <button
            onClick={() => setSelectedTab('queue')}
            className={`px-4 py-3 font-medium transition-colors ${
              selectedTab === 'queue'
                ? 'border-b-2 border-khummela-primary text-khummela-primary'
                : 'text-khummela-muted hover:text-khummela-text'
            }`}
          >
            Verification Queue
          </button>
          <button
            onClick={() => setSelectedTab('cases')}
            className={`px-4 py-3 font-medium transition-colors ${
              selectedTab === 'cases'
                ? 'border-b-2 border-khummela-primary text-khummela-primary'
                : 'text-khummela-muted hover:text-khummela-text'
            }`}
          >
            Cases
          </button>
          <button
            onClick={() => setSelectedTab('analytics')}
            className={`px-4 py-3 font-medium transition-colors ${
              selectedTab === 'analytics'
                ? 'border-b-2 border-khummela-primary text-khummela-primary'
                : 'text-khummela-muted hover:text-khummela-text'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'queue' && <VerificationQueue matches={data?.verificationQueue || []} onRefresh={loadDashboard} />}
        {selectedTab === 'cases' && <CasesView />}
        {selectedTab === 'analytics' && <AnalyticsView data={data} />}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function VerificationQueue({ matches, onRefresh }: { matches: any[]; onRefresh: () => void }) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'CONFIRMED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');

  const handleReview = async () => {
    if (!reviewingId || !reviewStatus) return;

    try {
      const res = await fetch(`/api/match-suggestions/${reviewingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        setReviewingId(null);
        setReviewStatus(null);
        setNotes('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error reviewing match:', err);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-khummela-border bg-white p-12 text-center">
        <p className="text-khummela-muted">No pending matches to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div key={match.id} className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-khummela-text">
                {match.missingReport.personName} (Missing) ↔️ Found Person
              </h3>
              <div className="mt-2 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-khummela-muted">Missing Age</p>
                  <p className="font-medium text-khummela-text">{match.missingReport.age || '?'}</p>
                </div>
                <div>
                  <p className="text-xs text-khummela-muted">Found Age</p>
                  <p className="font-medium text-khummela-text">{match.foundReport.age || '?'}</p>
                </div>
                <div>
                  <p className="text-xs text-khummela-muted">Match Score</p>
                  <p className="font-medium text-khummela-text">{match.score}%</p>
                </div>
                <div>
                  <p className="text-xs text-khummela-muted">Reported</p>
                  <p className="font-medium text-khummela-text">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {reviewingId !== match.id && (
              <button
                onClick={() => setReviewingId(match.id)}
                className="ml-4 rounded-lg bg-khummela-primary px-4 py-2 font-medium text-white hover:bg-khummela-primary-dark"
              >
                Review
              </button>
            )}
          </div>

          {reviewingId === match.id && (
            <div className="mt-4 border-t border-khummela-border pt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-khummela-text">Decision</label>
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => setReviewStatus('CONFIRMED')}
                    className={`rounded px-4 py-2 font-medium ${
                      reviewStatus === 'CONFIRMED'
                        ? 'bg-green-500 text-white'
                        : 'border border-khummela-border text-khummela-text hover:bg-khummela-surface'
                    }`}
                  >
                    ✓ Confirm
                  </button>
                  <button
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`rounded px-4 py-2 font-medium ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-red-500 text-white'
                        : 'border border-khummela-border text-khummela-text hover:bg-khummela-surface'
                    }`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-khummela-text">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this match..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-khummela-border px-3 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReview}
                  disabled={!reviewStatus}
                  className="flex-1 rounded-lg bg-khummela-primary px-4 py-2 font-medium text-white hover:bg-khummela-primary-dark disabled:opacity-50"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => {
                    setReviewingId(null);
                    setReviewStatus(null);
                    setNotes('');
                  }}
                  className="rounded-lg border border-khummela-border px-4 py-2 font-medium text-khummela-text hover:bg-khummela-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CasesView() {
  return (
    <div className="rounded-xl border border-khummela-border bg-white p-8 text-center">
      <p className="text-khummela-muted">Cases management view coming soon</p>
      <Link href="/search" className="mt-4 inline-block text-khummela-primary hover:text-khummela-primary-dark">
        View all cases
      </Link>
    </div>
  );
}

function AnalyticsView({ data }: { data: DashboardData | null }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-khummela-text">Unresolved by Gender</h3>
        <div className="mt-4 space-y-2">
          {data?.unresolvedByGender && data.unresolvedByGender.length > 0 ? (
            data.unresolvedByGender.map((item) => (
              <div key={item.gender} className="flex justify-between rounded-lg bg-khummela-surface p-3">
                <p className="capitalize text-khummela-text font-medium">{item.gender}</p>
                <p className="font-semibold text-khummela-primary">{item._count}</p>
              </div>
            ))
          ) : (
            <p className="text-khummela-muted">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
