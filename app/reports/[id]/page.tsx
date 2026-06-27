'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ReportData {
  id: string;
  reportType: 'missing' | 'found';
  personName?: string;
  age: number | null;
  gender: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  lastSeenAt?: string;
  foundAt?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: Array<{ id: string; url: string }>;
}

interface PotentialMatch {
  id: string;
  type: 'missing' | 'found';
  age: number | null;
  gender: string;
  description: string | null;
  score: number;
  createdAt: string;
}

export default function ReportDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestingMatch, setSuggestingMatch] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    if (status === 'authenticated') {
      loadReport();
    }
  }, [status, reportId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, matchesRes] = await Promise.all([
        fetch(`/api/reports/${reportId}`),
        fetch(`/api/reports/${reportId}/matches`),
      ]);

      if (!reportRes.ok) {
        throw new Error('Report not found');
      }

      const reportJson = await reportRes.json();
      setReport(reportJson.data);

      if (matchesRes.ok) {
        const matchesJson = await matchesRes.json();
        setPotentialMatches(matchesJson.data.potentialMatches || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestMatch = async () => {
    if (!selectedMatchId) return;

    setSuggestingMatch(selectedMatchId);
    try {
      const payload =
        report?.reportType === 'missing'
          ? {
              missingReportId: reportId,
              foundReportId: selectedMatchId,
            }
          : {
              missingReportId: selectedMatchId,
              foundReportId: reportId,
            };

      const res = await fetch('/api/match-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to suggest match');
      }

      setShowSuggestModal(false);
      setSelectedMatchId(null);
      loadReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest match');
    } finally {
      setSuggestingMatch(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-bg">
        <div className="text-khummela-muted">Loading...</div>
      </div>
    );
  }

  if (!session?.user || !report) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-bg">
        <div className="text-center">
          <p className="mb-4 text-khummela-muted">{error || 'Report not found'}</p>
          <Link href="/dashboard" className="text-khummela-primary hover:text-khummela-primary-dark">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session.user.role === 'MANAGEMENT'; // Simplified for demo
  const canSuggestMatch = isOwner || session.user.role === 'MANAGEMENT';

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
          <Link href="/search" className="text-sm font-medium text-khummela-primary hover:text-khummela-primary-dark">
            Back to Search
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Report Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-khummela-text">
                    {report.personName || 'Found Person'}
                  </h1>
                  <p className="mt-1 text-khummela-muted">
                    {report.reportType === 'missing' ? '🔍 Missing' : '✅ Found'} •{' '}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                    report.status === 'OPEN'
                      ? 'bg-yellow-100 text-yellow-700'
                      : report.status === 'RESOLVED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {report.age && (
                  <div>
                    <p className="text-sm font-medium text-khummela-muted">Age</p>
                    <p className="text-lg font-semibold text-khummela-text">{report.age}</p>
                  </div>
                )}
                {report.gender && report.gender !== 'UNKNOWN' && (
                  <div>
                    <p className="text-sm font-medium text-khummela-muted">Gender</p>
                    <p className="text-lg font-semibold text-khummela-text">{report.gender}</p>
                  </div>
                )}
                {report.location?.state && (
                  <div>
                    <p className="text-sm font-medium text-khummela-muted">Location</p>
                    <p className="text-lg font-semibold text-khummela-text">
                      {report.location.city || 'Unknown'}, {report.location.state}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {report.description && (
              <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-khummela-text">Description</h2>
                <p className="mt-3 text-khummela-text">{report.description}</p>
              </div>
            )}

            {/* Images */}
            {report.images && report.images.length > 0 && (
              <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-khummela-text">Photos</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {report.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="Report"
                      className="h-48 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-khummela-text">Contact Information</h2>
              <div className="mt-4 space-y-2 text-sm text-khummela-text">
                {report.contactName && (
                  <p>
                    <span className="font-medium">Name:</span> {report.contactName}
                  </p>
                )}
                {report.contactPhone && (
                  <p>
                    <span className="font-medium">Phone:</span> {report.contactPhone}
                  </p>
                )}
                {report.contactEmail && (
                  <p>
                    <span className="font-medium">Email:</span> {report.contactEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Potential Matches Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-khummela-text">
                Potential Matches ({potentialMatches.length})
              </h2>

              {potentialMatches.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {potentialMatches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-lg border border-khummela-border p-4 hover:bg-khummela-surface"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-khummela-text">
                            {match.age || '?'} • {match.gender}
                          </p>
                          <p className="mt-1 text-xs text-khummela-muted line-clamp-2">
                            {match.description}
                          </p>
                        </div>
                        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-sm font-bold text-blue-700">
                          {match.score}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMatchId(match.id);
                          setShowSuggestModal(true);
                        }}
                        className="mt-2 w-full rounded bg-khummela-primary px-3 py-1 text-sm font-medium text-white hover:bg-khummela-primary-dark disabled:opacity-50"
                        disabled={!canSuggestMatch || suggestingMatch === match.id}
                      >
                        {suggestingMatch === match.id ? 'Suggesting...' : 'Suggest Match'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-khummela-muted">No potential matches found.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-khummela-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-khummela-text">Actions</h2>
              <div className="mt-4 space-y-2">
                <Link
                  href={`/reports/new?type=${report.reportType === 'missing' ? 'found' : 'missing'}`}
                  className="block w-full rounded-lg bg-khummela-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-khummela-accent-dark"
                >
                  Report {report.reportType === 'missing' ? 'Found' : 'Missing'} Person
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Suggest Match Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-khummela-text">Confirm Match Suggestion</h3>
            <p className="mt-2 text-sm text-khummela-muted">
              This match will be sent to management for review. Are you sure?
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowSuggestModal(false);
                  setSelectedMatchId(null);
                }}
                className="flex-1 rounded-lg border border-khummela-border px-4 py-2 font-medium text-khummela-text hover:bg-khummela-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSuggestMatch}
                disabled={suggestingMatch !== null}
                className="flex-1 rounded-lg bg-khummela-primary px-4 py-2 font-medium text-white hover:bg-khummela-primary-dark disabled:opacity-50"
              >
                {suggestingMatch ? 'Suggesting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
