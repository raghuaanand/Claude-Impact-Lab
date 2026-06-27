'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getVoiceInputManager } from '@/lib/voice-input';

interface FormStep {
  name: string;
  value: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  label: string;
  icon: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export default function SimpleFoundForm({ language }: { language: string }) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const voiceManagerRef = useRef<any>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  useEffect(() => {
    const mgr = getVoiceInputManager('hi-IN');
    setVoiceSupported(mgr.isSupported());
    voiceManagerRef.current = mgr;

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    age: '',
    gender: 'UNKNOWN',
    description: '',
    contactName: '',
    contactPhone: '',
    location: {
      city: '',
      state: '',
    },
    consent: false,
  });

  const steps: FormStep[] = [
    {
      name: 'age',
      value: formData.age,
      type: 'number',
      label: 'Age of the person?',
      icon: '🎂',
      placeholder: 'Approximate age',
    },
    {
      name: 'gender',
      value: formData.gender,
      type: 'select',
      label: 'Gender?',
      icon: '👥',
      options: [
        { value: 'UNKNOWN', label: 'Not sure' },
        { value: 'MALE', label: 'Male 👨' },
        { value: 'FEMALE', label: 'Female 👩' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    {
      name: 'description',
      value: formData.description,
      type: 'textarea',
      label: 'Describe what they look like',
      icon: '👕',
      placeholder: 'Clothing, hair, marks, anything you remember...',
      required: true,
    },
    {
      name: 'city',
      value: formData.location.city,
      type: 'text',
      label: 'Where did you find them? (City)',
      icon: '📍',
      placeholder: 'City name',
      required: true,
    },
    {
      name: 'state',
      value: formData.location.state,
      type: 'text',
      label: 'Which state?',
      icon: '🗺️',
      placeholder: 'State name',
    },
    {
      name: 'contactName',
      value: formData.contactName,
      type: 'text',
      label: 'Your name?',
      icon: '📝',
      placeholder: 'Your name',
      required: true,
    },
    {
      name: 'contactPhone',
      value: formData.contactPhone,
      type: 'text',
      label: 'Your phone number?',
      icon: '📞',
      placeholder: 'Phone number',
    },
    {
      name: 'consent',
      value: formData.consent ? 'yes' : 'no',
      type: 'select',
      label: 'Help find their family?',
      icon: '❤️',
      options: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes, reunite them' },
      ],
      required: true,
    },
  ];

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleInputChange = (value: string) => {
    if (currentStep.name === 'age') {
      setFormData((prev) => ({ ...prev, [currentStep.name]: value }));
    } else if (['city', 'state'].includes(currentStep.name)) {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [currentStep.name]: value },
      }));
    } else if (currentStep.name === 'consent') {
      setFormData((prev) => ({ ...prev, consent: value === 'yes' }));
    } else {
      setFormData((prev) => ({ ...prev, [currentStep.name]: value }));
    }
  };

  const handleStartVoice = () => {
    if (!voiceManagerRef.current || !voiceSupported) return;

    setIsRecording(true);
    setVoiceTranscript('');
    setRecordingTime(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    voiceManagerRef.current.start((result: any) => {
      setVoiceTranscript(result.text);
      if (result.isFinal) {
        handleInputChange(result.text);
      }
    });
  };

  const handleStopVoice = () => {
    if (!voiceManagerRef.current) return;

    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    const finalText = voiceManagerRef.current.stop();
    if (finalText) {
      handleInputChange(finalText);
    }
  };

  const handleNext = () => {
    if (currentStep.required && !currentStep.value) {
      setError(`Please answer: ${currentStep.label}`);
      return;
    }
    setError(null);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        description: formData.description.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim() || null,
        contactEmail: null,
        location: {
          city: formData.location.city.trim() || null,
          state: formData.location.state.trim() || null,
          country: 'India',
          address: null,
          postalCode: null,
        },
      };

      const res = await fetch('/api/reports/found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create report');
      }

      router.push('/simple-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 h-2 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-khummela-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-khummela-muted">
          {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {/* Current Question */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h2 className="text-3xl font-bold text-khummela-text">{currentStep.label}</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Input Field */}
        <div className="mb-8">
          {currentStep.type === 'text' && (
            <input
              type="text"
              value={currentStep.value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full rounded-2xl border-2 border-khummela-accent px-6 py-4 text-2xl text-khummela-text placeholder-khummela-muted focus:outline-none"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            />
          )}

          {currentStep.type === 'number' && (
            <input
              type="number"
              value={currentStep.value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full rounded-2xl border-2 border-khummela-accent px-6 py-4 text-2xl text-khummela-text placeholder-khummela-muted focus:outline-none"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            />
          )}

          {currentStep.type === 'textarea' && (
            <textarea
              value={currentStep.value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={4}
              className="w-full rounded-2xl border-2 border-khummela-accent px-6 py-4 text-xl text-khummela-text placeholder-khummela-muted focus:outline-none resize-none"
              autoFocus
            />
          )}

          {currentStep.type === 'select' && (
            <div className="grid grid-cols-2 gap-3">
              {currentStep.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange(option.value)}
                  className={`rounded-2xl px-6 py-4 text-lg font-bold transition-all active:scale-95 ${
                    currentStep.value === option.value
                      ? 'bg-khummela-accent text-white shadow-lg'
                      : 'border-2 border-khummela-accent bg-white text-khummela-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Voice Input Button */}
          {voiceSupported && (currentStep.type === 'text' || currentStep.type === 'textarea') && (
            <div className="mt-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="w-full rounded-2xl bg-blue-500 px-6 py-4 text-2xl font-bold text-white hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  🎤 Tap to speak
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="w-full rounded-2xl bg-red-500 px-6 py-4 text-2xl font-bold text-white hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 animate-pulse"
                >
                  ⏹️ Stop ({recordingTime}s)
                </button>
              )}

              {voiceTranscript && (
                <div className="mt-3 rounded-xl bg-blue-50 p-3 text-lg text-blue-900">
                  <p className="text-xs text-blue-700 mb-1">You said:</p>
                  <p className="font-semibold">{voiceTranscript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0 || loading}
          className="flex-1 rounded-2xl border-2 border-khummela-accent px-6 py-4 text-2xl font-bold text-khummela-accent hover:bg-khummela-surface disabled:opacity-50 transition-all active:scale-95"
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 rounded-2xl bg-khummela-accent px-6 py-4 text-2xl font-bold text-white hover:bg-khummela-accent-dark disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? 'Creating...' : currentStepIndex === steps.length - 1 ? '✓ Done' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
