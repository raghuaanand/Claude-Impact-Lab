'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  reportType: 'missing' | 'found';
  personName?: string;
  age: number | null;
  gender: string;
  description: string | null;
  status: string;
  createdAt: string;
  location?: {
    city?: string;
    state?: string;
  };
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    gender: searchParams.get('gender') || '',
    ageMin: searchParams.get('ageMin') || '',
    ageMax: searchParams.get('ageMax') || '',
    state: searchParams.get('state') || '',
    status: searchParams.get('status') || '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    if (status === 'authenticated') {
      performSearch(1);
    }
  }, [status]);

  const performSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      if (filters.q) params.append('q', filters.q);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.ageMin) params.append('ageMin', filters.ageMin);
      if (filters.ageMax) params.append('ageMax', filters.ageMax);
      if (filters.state) params.append('state', filters.state);
      if (filters.status) params.append('status', filters.status);

      const res = await fetch(`/api/reports/search?${params}`);
      if (!res.ok) throw new Error('Search failed');

      const json = await res.json();
      setResults(json.data);
      setPagination({
        page,
        total: json.pagination.total,
        totalPages: json.pagination.totalPages,
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-bg">
        <div className="text-khummela-muted">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
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
            <Link href="/reports/new?type=missing" className="text-sm font-medium text-khummela-primary hover:text-khummela-primary-dark">
              Report Missing
            </Link>
            <Link href="/reports/new?type=found" className="text-sm font-medium text-khummela-accent hover:text-khummela-accent-dark">
              Report Found
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Search Form */}
        <div className="mb-8 rounded-2xl border border-khummela-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-khummela-text">Search Reports</h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <input
                type="text"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search by name, description, location..."
                className="w-full rounded-lg border border-khummela-border px-4 py-3 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <select
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
                className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text focus:border-khummela-primary focus:outline-none"
              >
                <option value="">Any Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNKNOWN">Unknown</option>
              </select>

              <input
                type="number"
                name="ageMin"
                value={filters.ageMin}
                onChange={handleFilterChange}
                placeholder="Age Min"
                min="0"
                max="150"
                className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              />

              <input
                type="number"
                name="ageMax"
                value={filters.ageMax}
                onChange={handleFilterChange}
                placeholder="Age Max"
                min="0"
                max="150"
                className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              />

              <input
                type="text"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                placeholder="State/Province"
                className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              />

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text focus:border-khummela-primary focus:outline-none"
              >
                <option value="">Any Status</option>
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-khummela-primary px-4 py-2 font-medium text-white hover:bg-khummela-primary-dark disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-khummela-text">
              {pagination.total === 0 ? 'No results' : `Found ${pagination.total} report${pagination.total !== 1 ? 's' : ''}`}
            </h3>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <Link
                  key={`${result.reportType}-${result.id}`}
                  href={`/reports/${result.id}`}
                  className="rounded-xl border border-khummela-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        result.reportType === 'missing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {result.reportType === 'missing' ? '🔍 Missing' : '✅ Found'}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        result.status === 'OPEN'
                          ? 'bg-yellow-100 text-yellow-700'
                          : result.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  {result.personName && (
                    <h4 className="mb-2 text-lg font-semibold text-khummela-text">{result.personName}</h4>
                  )}

                  <div className="space-y-1 text-sm text-khummela-muted">
                    {result.age && (
                      <p>
                        <span className="font-medium">Age:</span> {result.age}
                      </p>
                    )}
                    {result.gender && result.gender !== 'UNKNOWN' && (
                      <p>
                        <span className="font-medium">Gender:</span> {result.gender}
                      </p>
                    )}
                    {result.location?.state && (
                      <p>
                        <span className="font-medium">Location:</span> {result.location.city || 'Unknown'},{' '}
                        {result.location.state}
                      </p>
                    )}
                  </div>

                  {result.description && (
                    <p className="mt-3 text-sm text-khummela-text line-clamp-2">{result.description}</p>
                  )}

                  <p className="mt-3 text-xs text-khummela-muted">
                    {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-khummela-border bg-white p-12 text-center">
              <p className="text-khummela-muted">No reports found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-8">
              {pagination.page > 1 && (
                <button
                  onClick={() => performSearch(pagination.page - 1)}
                  className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text hover:bg-khummela-surface"
                >
                  Previous
                </button>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => performSearch(page)}
                    className={`rounded px-3 py-2 text-sm font-medium ${
                      page === pagination.page
                        ? 'bg-khummela-primary text-white'
                        : 'border border-khummela-border text-khummela-text hover:bg-khummela-surface'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {pagination.page < pagination.totalPages && (
                <button
                  onClick={() => performSearch(pagination.page + 1)}
                  className="rounded-lg border border-khummela-border px-4 py-2 text-khummela-text hover:bg-khummela-surface"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
