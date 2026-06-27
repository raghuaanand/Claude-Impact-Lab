'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getVoiceInputManager } from '@/lib/voice-input';

interface ImageFile {
  id: string;
  url: string;
  file?: File;
}

export default function MissingReportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const voiceManagerRef = useRef<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recordingFieldId, setRecordingFieldId] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const mgr = getVoiceInputManager('en-IN');
    setVoiceSupported(mgr.isSupported());
    voiceManagerRef.current = mgr;

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    personName: '',
    age: '',
    gender: 'UNKNOWN',
    description: '',
    lastSeenAt: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
    },
  });

  const [consent, setConsent] = useState({
    dataProcessing: false,
    privacyPolicy: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('location.')) {
      const field = name.replace('location.', '');
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploadingImage(true);
    setError(null);

    try {
      for (const file of e.target.files) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        formDataToSend.append('reportType', 'missing');

        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formDataToSend,
        });

        if (!res.ok) {
          throw new Error('Failed to upload image');
        }

        const json = await res.json();
        setImages((prev) => [
          ...prev,
          {
            id: json.data.id,
            url: json.data.url,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleStartVoice = (fieldId: string) => {
    if (!voiceManagerRef.current || !voiceSupported) return;

    setRecordingFieldId(fieldId);
    setVoiceTranscript('');
    setRecordingTime(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    voiceManagerRef.current.start((result: any) => {
      setVoiceTranscript(result.text);
      if (result.isFinal) {
        addTextToField(fieldId, result.text);
      }
    });
  };

  const handleStopVoice = () => {
    if (!voiceManagerRef.current) return;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    const finalText = voiceManagerRef.current.stop();
    if (finalText && recordingFieldId) {
      addTextToField(recordingFieldId, finalText);
    }
    setRecordingFieldId(null);
  };

  const addTextToField = (fieldId: string, text: string) => {
    if (fieldId === 'personName') {
      setFormData((prev) => ({ ...prev, personName: text }));
    } else if (fieldId === 'description') {
      setFormData((prev) => ({ ...prev, description: text }));
    } else if (fieldId === 'contactName') {
      setFormData((prev) => ({ ...prev, contactName: text }));
    } else if (fieldId === 'contactPhone') {
      setFormData((prev) => ({ ...prev, contactPhone: text }));
    } else if (fieldId === 'address') {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, address: text },
      }));
    } else if (fieldId === 'city') {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, city: text },
      }));
    } else if (fieldId === 'state') {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, state: text },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.personName.trim()) {
        throw new Error('Person name is required');
      }

      if (!consent.dataProcessing || !consent.privacyPolicy) {
        throw new Error('You must consent to data processing and privacy policy');
      }

      const payload = {
        personName: formData.personName.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        description: formData.description.trim() || null,
        lastSeenAt: formData.lastSeenAt ? new Date(formData.lastSeenAt).toISOString() : null,
        contactName: formData.contactName.trim() || null,
        contactPhone: formData.contactPhone.trim() || null,
        contactEmail: formData.contactEmail.trim() || null,
        location: {
          address: formData.location.address || null,
          city: formData.location.city || null,
          state: formData.location.state || null,
          country: formData.location.country || null,
          postalCode: formData.location.postalCode || null,
        },
      };

      const res = await fetch('/api/reports/missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create report');
      }

      const json = await res.json();
      router.push(`/reports/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-khummela-text">Report Missing Person</h2>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Person Details */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Person Details</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              name="personName"
              value={formData.personName}
              onChange={handleInputChange}
              placeholder="Full name of missing person"
              className="flex-1 rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              required
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={() =>
                  recordingFieldId === 'personName'
                    ? handleStopVoice()
                    : handleStartVoice('personName')
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                  recordingFieldId === 'personName'
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Click to use voice input"
              >
                {recordingFieldId === 'personName' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          {recordingFieldId === 'personName' && voiceTranscript && (
            <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-900">
              <strong>Hearing:</strong> {voiceTranscript}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-khummela-text">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="Age in years"
              min="0"
              max="150"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-khummela-text">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text focus:border-khummela-primary focus:outline-none"
            >
              <option value="UNKNOWN">Unknown</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Description</label>
          <div className="flex gap-2 mt-1">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Physical description, clothing, distinguishing features, etc."
              rows={4}
              className="flex-1 rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={() =>
                  recordingFieldId === 'description'
                    ? handleStopVoice()
                    : handleStartVoice('description')
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 h-fit ${
                  recordingFieldId === 'description'
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Click to use voice input"
              >
                {recordingFieldId === 'description' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          {recordingFieldId === 'description' && voiceTranscript && (
            <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-900">
              <strong>Hearing:</strong> {voiceTranscript}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Last Seen At</label>
          <input
            type="datetime-local"
            name="lastSeenAt"
            value={formData.lastSeenAt}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text focus:border-khummela-primary focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Location */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Last Seen Location</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Address</label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleInputChange}
            placeholder="Street address"
            className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-khummela-text">City</label>
            <input
              type="text"
              name="location.city"
              value={formData.location.city}
              onChange={handleInputChange}
              placeholder="City"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-khummela-text">State</label>
            <input
              type="text"
              name="location.state"
              value={formData.location.state}
              onChange={handleInputChange}
              placeholder="State/Province"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-khummela-text">Postal Code</label>
            <input
              type="text"
              name="location.postalCode"
              value={formData.location.postalCode}
              onChange={handleInputChange}
              placeholder="Postal code"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Contact Information */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Contact Information</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Contact Name</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              placeholder="Name of person reporting"
              className="flex-1 rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={() =>
                  recordingFieldId === 'contactName'
                    ? handleStopVoice()
                    : handleStartVoice('contactName')
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                  recordingFieldId === 'contactName'
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Click to use voice input"
              >
                {recordingFieldId === 'contactName' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          {recordingFieldId === 'contactName' && voiceTranscript && (
            <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-900">
              <strong>Hearing:</strong> {voiceTranscript}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-khummela-text">Phone</label>
            <div className="flex gap-2 mt-1">
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="flex-1 rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={() =>
                    recordingFieldId === 'contactPhone'
                      ? handleStopVoice()
                      : handleStartVoice('contactPhone')
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${
                    recordingFieldId === 'contactPhone'
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  title="Click to use voice input"
                >
                  {recordingFieldId === 'contactPhone' ? '⏹️' : '🎤'}
                </button>
              )}
            </div>
            {recordingFieldId === 'contactPhone' && voiceTranscript && (
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-900">
                <strong>Hearing:</strong> {voiceTranscript}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-khummela-text">Email</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              placeholder="Email address"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Images */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Photos</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Upload Photos</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="mt-1 w-full"
          />
          {uploadingImage && <p className="mt-2 text-sm text-khummela-muted">Uploading...</p>}
        </div>

        {images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt="Report"
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* Consent & Privacy */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Data & Privacy Consent</legend>

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">How your data will be used:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your information will be used only for reunification purposes at Kumbh Mela</li>
            <li>Identity data (name, phone) is stored separately and encrypted</li>
            <li>Once the person is found and confirmed, all personal data will be deleted</li>
            <li>Data will never be shared with advertisers or used for other purposes</li>
          </ul>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent.dataProcessing}
            onChange={(e) => setConsent((prev) => ({ ...prev, dataProcessing: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm text-khummela-text">
            I consent to the processing of my personal data for reunification purposes only
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent.privacyPolicy}
            onChange={(e) => setConsent((prev) => ({ ...prev, privacyPolicy: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm text-khummela-text">
            I have read and agree to the privacy policy and DPDP Act compliance terms
          </span>
        </label>
      </fieldset>

      {/* Submit */}
      <div className="flex gap-4 border-t border-khummela-border pt-6">
        <button
          type="submit"
          disabled={loading || !consent.dataProcessing || !consent.privacyPolicy}
          className="flex-1 rounded-lg bg-khummela-primary px-6 py-3 font-medium text-white hover:bg-khummela-primary-dark disabled:opacity-50"
        >
          {loading ? 'Creating Report...' : 'Create Report'}
        </button>
      </div>
    </form>
  );
}
