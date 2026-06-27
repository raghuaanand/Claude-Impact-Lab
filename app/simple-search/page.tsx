'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SearchResult {
  id: string;
  reportType: 'missing' | 'found';
  personName?: string;
  age: number | null;
  gender: string;
  status: string;
  createdAt: string;
  location?: {
    city?: string;
    state?: string;
  };
}

export default function SimpleSearchPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }
  }, [status]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-primary">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/reports/search?q=${encodeURIComponent(query)}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-khummela-bg">
      {/* Header */}
      <div className="border-b border-khummela-border bg-white px-6 py-4">
        <Link href="/simple-dashboard" className="text-3xl text-khummela-primary">
          ←
        </Link>
      </div>

      {/* Search Box */}
      <div className="bg-white px-6 py-6 border-b border-khummela-border">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search..."
            className="flex-1 rounded-2xl border-2 border-khummela-primary px-4 py-3 text-lg text-khummela-text placeholder-khummela-muted focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-2xl bg-khummela-primary px-6 py-3 font-bold text-white hover:bg-khummela-primary-dark disabled:opacity-50 transition-all active:scale-95"
          >
            🔎
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {searching && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-khummela-muted">Searching...</p>
          </div>
        )}

        {!searching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">😔</div>
            <p className="text-khummela-muted">No results found</p>
          </div>
        )}

        {!searching && !hasSearched && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔎</div>
            <p className="text-khummela-muted">Search for a person</p>
          </div>
        )}

        {!searching && hasSearched && results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={`${result.reportType}-${result.id}`}
                href={`/reports/${result.id}`}
                className="block rounded-2xl bg-white p-4 shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">
                    {result.reportType === 'missing' ? '🔍' : '✅'}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      result.status === 'OPEN'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {result.personName && (
                  <h3 className="text-lg font-bold text-khummela-text">
                    {result.personName}
                  </h3>
                )}

                <div className="mt-2 space-y-1 text-sm text-khummela-muted">
                  {result.age && <p>Age: {result.age}</p>}
                  {result.gender && result.gender !== 'UNKNOWN' && (
                    <p>Gender: {result.gender}</p>
                  )}
                  {result.location?.city && (
                    <p>
                      Location: {result.location.city}
                      {result.location.state ? `, ${result.location.state}` : ''}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
