'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import MissingReportForm from '@/components/forms/MissingReportForm';
import FoundReportForm from '@/components/forms/FoundReportForm';

export default function NewReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reportType, setReportType] = useState<'missing' | 'found'>('missing');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/signin');
    }

    const type = searchParams.get('type');
    if (type === 'found') {
      setReportType('found');
    }
  }, [status, searchParams]);

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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white text-sm">
              K
            </div>
            <span className="font-semibold text-khummela-text">KHUMMELA</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Type Toggle */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => {
              setReportType('missing');
              router.push('/reports/new?type=missing');
            }}
            className={`rounded-lg px-6 py-3 font-medium transition-colors ${
              reportType === 'missing'
                ? 'bg-khummela-primary text-white'
                : 'border border-khummela-border bg-white text-khummela-text hover:bg-khummela-surface'
            }`}
          >
            Report Missing Person
          </button>
          <button
            onClick={() => {
              setReportType('found');
              router.push('/reports/new?type=found');
            }}
            className={`rounded-lg px-6 py-3 font-medium transition-colors ${
              reportType === 'found'
                ? 'bg-khummela-accent text-white'
                : 'border border-khummela-border bg-white text-khummela-text hover:bg-khummela-surface'
            }`}
          >
            Report Found Person
          </button>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
          {reportType === 'missing' ? (
            <MissingReportForm />
          ) : (
            <FoundReportForm />
          )}
        </div>
      </main>
    </div>
  );
}
