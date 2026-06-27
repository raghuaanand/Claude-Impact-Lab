'use client';

import { useEffect, useState, useRef } from 'react';
import { getVoiceInputManager } from '@/lib/voice-input';

export default function VoiceTestPage() {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const voiceMgrRef = useRef<any>(null);

  useEffect(() => {
    addLog('Page loaded');

    try {
      addLog('Initializing voice manager...');
      const mgr = getVoiceInputManager('en-US');
      voiceMgrRef.current = mgr;

      const isSupported = mgr.isSupported();
      addLog(`Voice supported: ${isSupported}`);
      setSupported(isSupported);

      if (!isSupported) {
        setError('Web Speech API not supported in this browser');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errMsg}`);
      setError(errMsg);
    }
  }, []);

  const addLog = (message: string) => {
    console.log(`[VOICE TEST] ${message}`);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleStart = () => {
    if (!voiceMgrRef.current) {
      setError('Voice manager not initialized');
      return;
    }

    addLog('Starting voice input...');
    setTranscript('');
    setError(null);
    setIsListening(true);

    try {
      voiceMgrRef.current.start((result: any) => {
        addLog(`Transcript: "${result.text}" (final: ${result.isFinal})`);
        setTranscript(result.text);
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Start error: ${errMsg}`);
      setError(errMsg);
      setIsListening(false);
    }
  };

  const handleStop = () => {
    if (!voiceMgrRef.current) return;

    addLog('Stopping voice input...');
    try {
      const final = voiceMgrRef.current.stop();
      addLog(`Final transcript: "${final}"`);
      setIsListening(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Stop error: ${errMsg}`);
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-khummela-bg p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-khummela-text">🎤 Voice Test Page</h1>
          <p className="mt-2 text-khummela-muted">
            Debug voice input functionality
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-khummela-text mb-4">Status</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
              <span className="font-medium text-khummela-text">Web Speech API Supported:</span>
              <span
                className={`text-2xl font-bold ${
                  supported ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {supported ? '✅ YES' : '❌ NO'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
              <span className="font-medium text-khummela-text">Currently Listening:</span>
              <span
                className={`text-2xl font-bold ${
                  isListening ? 'text-blue-600 animate-pulse' : 'text-gray-600'
                }`}
              >
                {isListening ? '🎤 YES' : '⭕ NO'}
              </span>
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 p-4 text-red-700">
                <p className="font-bold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-khummela-text mb-4">Controls</h2>

          <div className="space-y-3">
            <button
              onClick={handleStart}
              disabled={!supported || isListening}
              className="w-full rounded-2xl bg-blue-500 px-6 py-4 text-2xl font-bold text-white hover:bg-blue-600 disabled:bg-gray-400 transition-all active:scale-95"
            >
              🎤 Start Listening
            </button>

            <button
              onClick={handleStop}
              disabled={!isListening}
              className="w-full rounded-2xl bg-red-500 px-6 py-4 text-2xl font-bold text-white hover:bg-red-600 disabled:bg-gray-400 transition-all active:scale-95"
            >
              ⏹️ Stop Listening
            </button>

            <button
              onClick={() => {
                setTranscript('');
                setError(null);
                setLogs([]);
                addLog('Cleared');
              }}
              className="w-full rounded-2xl border-2 border-khummela-primary px-6 py-4 text-lg font-bold text-khummela-primary hover:bg-khummela-surface transition-all active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-khummela-text mb-4">Current Transcript</h2>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-2xl font-semibold text-blue-900">{transcript}</p>
            </div>
          </div>
        )}

        {/* Browser Info */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-khummela-text mb-4">Browser Info</h2>
          <div className="space-y-2 text-sm font-mono text-khummela-muted">
            <p>User Agent:</p>
            <p className="break-all bg-gray-100 p-3 rounded">
              {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}
            </p>

            <p className="mt-4">Supported APIs:</p>
            <ul className="list-disc list-inside space-y-1 bg-gray-100 p-3 rounded">
              <li>
                SpeechRecognition:{' '}
                {typeof window !== 'undefined' &&
                ((window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition)
                  ? '✅'
                  : '❌'}
              </li>
              <li>
                getUserMedia:{' '}
                {typeof window !== 'undefined' &&
                navigator.mediaDevices?.getUserMedia
                  ? '✅'
                  : '❌'}
              </li>
            </ul>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-khummela-text mb-4">Debug Logs</h2>
          <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-xs text-green-400">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-2xl bg-yellow-50 border-2 border-yellow-200 p-6">
          <h3 className="font-bold text-yellow-900 mb-2">📋 How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
            <li>Check the "Web Speech API Supported" status above</li>
            <li>If supported, click "Start Listening"</li>
            <li>Speak clearly (e.g., "Hello world")</li>
            <li>Watch the logs for real-time updates</li>
            <li>Click "Stop Listening" when done</li>
            <li>Check the transcript display</li>
            <li>Share the browser info and logs if it doesn't work</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
