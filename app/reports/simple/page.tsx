'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import SimpleMissingForm from '@/components/forms/SimpleMissingForm';
import SimpleFoundForm from '@/components/forms/SimpleFoundForm';
import { SUPPORTED_LANGUAGES } from '@/lib/bhashini';

export default function SimpleReportPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'type' | 'language' | 'form'>('type');
  const [reportType, setReportType] = useState<'missing' | 'found' | null>(null);
  const [language, setLanguage] = useState('en');

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-khummela-bg">
        <div className="text-khummela-muted">Loading...</div>
      </div>
    );
  }

  // Step 1: Choose report type
  if (step === 'type') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-8 bg-khummela-primary px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">KHUMMELA</h1>
          <p className="mt-2 text-lg text-white/80">Family Reunion App</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => {
              setReportType('missing');
              setStep('language');
            }}
            className="flex h-32 w-full items-center justify-center rounded-3xl bg-white text-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div>
              <div className="text-6xl">🔍</div>
              <div className="mt-2 text-2xl font-bold text-khummela-text">Someone Missing?</div>
              <p className="text-sm text-khummela-muted">I lost someone</p>
            </div>
          </button>

          <button
            onClick={() => {
              setReportType('found');
              setStep('language');
            }}
            className="flex h-32 w-full items-center justify-center rounded-3xl bg-white text-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <div>
              <div className="text-6xl">✅</div>
              <div className="mt-2 text-2xl font-bold text-khummela-text">Found Someone?</div>
              <p className="text-sm text-khummela-muted">I found a person</p>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-white/60">
          Choose what you want to report
        </p>
      </div>
    );
  }

  // Step 2: Choose language
  if (step === 'language') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-khummela-accent px-4 py-8">
        <button
          onClick={() => setStep('type')}
          className="absolute top-4 left-4 text-4xl text-white hover:opacity-80"
        >
          ←
        </button>

        <div className="text-center">
          <div className="text-5xl mb-3">🌐</div>
          <h2 className="text-3xl font-bold text-white">Choose Language</h2>
          <p className="mt-2 text-white/80">Select your language</p>
        </div>

        <div className="w-full max-w-sm grid grid-cols-2 gap-3">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                setStep('form');
              }}
              className="rounded-2xl bg-white px-4 py-4 font-bold text-khummela-text shadow-md hover:shadow-lg active:scale-95 transition-all text-center text-sm"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Form
  if (step === 'form' && reportType) {
    return (
      <div className="flex flex-col h-screen bg-khummela-bg">
        <div className="flex items-center justify-between border-b border-khummela-border bg-white px-6 py-4">
          <button
            onClick={() => {
              setStep('language');
              setReportType(null);
            }}
            className="text-3xl text-khummela-primary hover:opacity-80"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-khummela-text">
              {reportType === 'missing' ? '🔍 Missing' : '✅ Found'}
            </h1>
            <p className="text-xs text-khummela-muted">
              {Object.entries(SUPPORTED_LANGUAGES).find(([code]) => code === language)?.[1]}
            </p>
          </div>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {reportType === 'missing' ? (
            <SimpleMissingForm language={language} />
          ) : (
            <SimpleFoundForm language={language} />
          )}
        </div>
      </div>
    );
  }

  return null;
}
