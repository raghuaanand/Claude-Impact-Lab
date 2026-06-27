'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImageFile {
  id: string;
  url: string;
}

export default function FoundReportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    gender: 'UNKNOWN',
    description: '',
    foundAt: '',
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
        formDataToSend.append('reportType', 'found');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      if (!consent.dataProcessing || !consent.privacyPolicy) {
        throw new Error('You must consent to data processing and privacy policy');
      }

      const payload = {
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        description: formData.description.trim(),
        foundAt: formData.foundAt ? new Date(formData.foundAt).toISOString() : null,
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

      const res = await fetch('/api/reports/found', {
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
      <h2 className="text-2xl font-bold text-khummela-text">Report Found Person</h2>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Person Details */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Person Description</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-khummela-text">Approximate Age</label>
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
          <label className="block text-sm font-medium text-khummela-text">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Physical description, clothing, distinguishing features, location found, etc."
            rows={4}
            className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Found At</label>
          <input
            type="datetime-local"
            name="foundAt"
            value={formData.foundAt}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text focus:border-khummela-primary focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Location */}
      <fieldset className="space-y-4 border-t border-khummela-border pt-4">
        <legend className="text-lg font-semibold text-khummela-text">Where Found</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Address</label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleInputChange}
            placeholder="Street address or landmark"
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
        <legend className="text-lg font-semibold text-khummela-text">Reporter Information</legend>

        <div>
          <label className="block text-sm font-medium text-khummela-text">Your Name</label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleInputChange}
            placeholder="Name of person reporting"
            className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-khummela-text">Phone</label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              placeholder="Phone number"
              className="mt-1 w-full rounded-lg border border-khummela-border px-4 py-2 text-khummela-text placeholder-khummela-muted focus:border-khummela-primary focus:outline-none"
            />
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
            <li>The found person's description is stored separately from identity data</li>
            <li>Once a match is confirmed and the person is reunified, all personal data will be deleted</li>
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
          className="flex-1 rounded-lg bg-khummela-accent px-6 py-3 font-medium text-white hover:bg-khummela-accent-dark disabled:opacity-50"
        >
          {loading ? 'Creating Report...' : 'Create Report'}
        </button>
      </div>
    </form>
  );
}
