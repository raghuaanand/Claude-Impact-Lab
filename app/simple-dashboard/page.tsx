'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { useEffect, useState } from 'react';

export default function SimpleDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    myOpenCases: 0,
    pendingMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    if (status === 'authenticated') {
      loadStats();
    }
  }, [status]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setStats({
          myOpenCases:
            (data.stats?.myOpenMissing || 0) + (data.stats?.myOpenFound || 0),
          pendingMatches: data.stats?.pendingMatches || 0,
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-primary">
        <div className="text-center">
          <div className="text-6xl mb-4">KHUMMELA</div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-khummela-bg">
      {/* Header */}
      <div className="border-b border-khummela-border bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-khummela-text">KHUMMELA</h1>
            <p className="text-sm text-khummela-muted">
              Welcome, {session.user.name || 'User'}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-3xl font-bold text-khummela-text">Welcome!</h2>
          <p className="mt-2 text-lg text-khummela-muted">
            What do you want to do?
          </p>
        </div>

        {/* Action Buttons - Large and Simple */}
        <div className="w-full max-w-sm space-y-4">
          {/* Report Missing */}
          <Link
            href="/reports/simple?type=missing"
            className="block h-28 rounded-3xl bg-khummela-primary text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <div className="text-5xl">🔍</div>
              <div className="text-xl font-bold">Report Missing</div>
            </div>
          </Link>

          {/* Report Found */}
          <Link
            href="/reports/simple?type=found"
            className="block h-28 rounded-3xl bg-khummela-accent text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <div className="text-5xl">✅</div>
              <div className="text-xl font-bold">Report Found</div>
            </div>
          </Link>

          {/* Search */}
          <Link
            href="/simple-search"
            className="block h-28 rounded-3xl border-4 border-khummela-primary text-khummela-primary shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <div className="text-5xl">🔎</div>
              <div className="text-xl font-bold">Search</div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-8">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-khummela-primary">
              {stats.myOpenCases}
            </div>
            <p className="mt-1 text-sm text-khummela-muted">My Cases</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-khummela-accent">
              {stats.pendingMatches}
            </div>
            <p className="mt-1 text-sm text-khummela-muted">Matches</p>
          </div>
        </div>

        {/* Help Button */}
        <div className="absolute bottom-6 left-6">
          <button className="h-16 w-16 rounded-full bg-red-500 text-white text-2xl shadow-lg hover:shadow-xl flex items-center justify-center">
            ☎️
          </button>
          <p className="mt-1 text-xs text-khummela-muted text-center">
            Call Help
          </p>
        </div>
      </div>
    </div>
  );
}
