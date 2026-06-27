"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { StepWizard } from "@/components/ui/StepWizard";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Card } from "@/components/ui/Card";
import {
  extractDescriptors,
  transcribeAudio,
  voiceCaptureErrorMessage,
  REPORT_LANGUAGES,
} from "@/lib/voice/intake";
import { startAudioCapture, type AudioCaptureSession } from "@/lib/voice/capture";
import { Mic } from "lucide-react";

const AGE_BANDS = ["0-12", "13-17", "18-40", "41-60", "61-70", "71-80", "80+"];
const GENDERS = ["Male", "Female", "Unknown"];
const LANGUAGES = [...REPORT_LANGUAGES];

type Zone = { id: string; name: string; code: string };

type ReportWizardProps = {
  type: "MISSING" | "FOUND";
};

export function ReportWizard({ type }: ReportWizardProps) {
  const router = useRouter();
  const steps =
    type === "MISSING"
      ? ["Who", "Where", "Description", "Photo", "Contact"]
      : ["Who", "Where", "Description", "Photo", "Location"];

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const captureRef = useRef<AudioCaptureSession | null>(null);

  const [form, setForm] = useState({
    personName: "",
    ageBand: "",
    gender: "",
    language: "Hindi",
    physicalDescription: "",
    lastSeenText: "",
    zoneId: "",
    reportingCenter: "",
    reporterPhone: "",
    state: "",
    district: "",
  });

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []))
      .catch(() => {});
  }, []);

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleVoice() {
    if (transcribing) return;

    if (listening && captureRef.current) {
      captureRef.current.stop();
      return;
    }

    setError("");
    setListening(true);
    const capture = startAudioCapture(25_000);
    captureRef.current = capture;

    try {
      const blob = await capture.done;
      setListening(false);
      setTranscribing(true);

      const text = await transcribeAudio(blob, form.language);
      const extracted = extractDescriptors(text);
      update({
        physicalDescription: text,
        ageBand: extracted.ageBand ?? form.ageBand,
        gender: extracted.gender ?? form.gender,
        lastSeenText: extracted.location ?? form.lastSeenText,
      });
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const message =
        code === "Speech recognition not supported in this browser"
          ? "Voice input not supported in this browser"
          : voiceCaptureErrorMessage(code);
      if (message) setError(message);
    } finally {
      setListening(false);
      setTranscribing(false);
      captureRef.current = null;
    }
  }

  async function uploadPhoto(id: string) {
    if (!photoFile) return;
    const presign = await fetch(`/api/cases/${id}/media/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: photoFile.name,
        contentType: photoFile.type,
      }),
    });
    if (!presign.ok) return;
    const { uploadUrl, s3Key } = await presign.json();
    await fetch(uploadUrl, { method: "PUT", body: photoFile, headers: { "Content-Type": photoFile.type } });
    await fetch(`/api/cases/${id}/media/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key, mimeType: photoFile.type, kind: "PHOTO" }),
    });
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to submit");
      setDoneRef(data.case.caseRef);
      if (photoFile) await uploadPhoto(data.case.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (doneRef) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-sm font-medium text-khummela-success">Report submitted</p>
        <p className="mt-4 text-2xl font-semibold text-khummela-text">Case registered</p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-khummela-primary">
          {doneRef}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-khummela-muted">
          Show this reference to the help desk. Your report is visible across all Khoya-Paaya
          centers.
        </p>
        <Button className="mt-8 w-full" size="lg" onClick={() => router.push("/")}>
          Done
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <StepWizard steps={steps} currentStep={step}>
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <Label>Person&apos;s name (if known)</Label>
              <Input
                className="mt-2 h-12"
                value={form.personName}
                onChange={(e) => update({ personName: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Age range</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AGE_BANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => update({ ageBand: b })}
                    className={`h-12 min-w-[4.5rem] rounded-xl px-3 text-sm font-medium transition-colors ${
                      form.ageBand === b
                        ? "bg-khummela-primary text-white"
                        : "bg-khummela-surface text-khummela-text"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Gender</Label>
              <div className="mt-2 flex gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update({ gender: g })}
                    className={`h-12 flex-1 rounded-xl text-sm font-medium ${
                      form.gender === g
                        ? "bg-khummela-primary text-white"
                        : "bg-khummela-surface text-khummela-text"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Zone / last seen area</Label>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => update({ zoneId: z.id, lastSeenText: z.name })}
                    className={`flex w-full items-center rounded-xl px-4 py-3 text-left text-sm ${
                      form.zoneId === z.id
                        ? "bg-khummela-primary text-white"
                        : "bg-white ring-1 ring-black/5"
                    }`}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Last seen details</Label>
              <Input
                className="mt-2 h-12"
                value={form.lastSeenText}
                onChange={(e) => update({ lastSeenText: e.target.value })}
                placeholder="e.g. Near Ramkund Ghat"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Language</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update({ language: l })}
                    className={`rounded-full px-4 py-2 text-sm ${
                      form.language === l
                        ? "bg-khummela-accent text-white"
                        : "bg-khummela-surface"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Physical description</Label>
                <button
                  type="button"
                  onClick={handleVoice}
                  disabled={transcribing}
                  className={`flex items-center gap-1 text-sm ${
                    listening || transcribing ? "text-khummela-muted" : "text-khummela-accent"
                  }`}
                >
                  <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
                  {transcribing
                    ? "Transcribing…"
                    : listening
                      ? "Recording… tap to finish"
                      : "Voice"}
                </button>
              </div>
              <textarea
                className="mt-2 w-full rounded-xl border border-khummela-border p-4 text-base focus:border-khummela-accent focus:outline-none focus:ring-2 focus:ring-khummela-accent/20"
                rows={4}
                value={form.physicalDescription}
                onChange={(e) => update({ physicalDescription: e.target.value })}
                placeholder="Clothing, distinguishing features…"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <PhotoUpload
            preview={photoPreview}
            onFileSelect={(file) => {
              setPhotoFile(file);
              setPhotoPreview(URL.createObjectURL(file));
            }}
          />
        )}

        {step === 4 && (
          <div className="space-y-4">
            {type === "MISSING" ? (
              <>
                <div>
                  <Label>Your mobile number</Label>
                  <Input
                    className="mt-2 h-12"
                    type="tel"
                    value={form.reporterPhone}
                    onChange={(e) => update({ reporterPhone: e.target.value })}
                    placeholder="+91"
                  />
                </div>
                <div>
                  <Label>Reporting center</Label>
                  <Input
                    className="mt-2 h-12"
                    value={form.reportingCenter}
                    onChange={(e) => update({ reportingCenter: e.target.value })}
                    placeholder="Khoya-Paaya Kendra name"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>Current location / center</Label>
                <Input
                  className="mt-2 h-12"
                  value={form.reportingCenter}
                  onChange={(e) => update({ reportingCenter: e.target.value })}
                  placeholder="Where the person was found"
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-khummela-error">{error}</p>
        )}
      </StepWizard>

      <div className="fixed bottom-0 left-0 right-0 border-t border-khummela-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              className="flex-1"
              size="lg"
              disabled={step === 0 && (!form.ageBand || !form.gender)}
              onClick={() => setStep(step + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button className="flex-1" size="lg" loading={loading} onClick={submit}>
              Submit report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
