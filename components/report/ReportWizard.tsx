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
import { localeToReportLanguage } from "@/lib/i18n/config";
import { useTranslation } from "@/components/i18n/LocaleProvider";
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
  const { t, locale } = useTranslation();
  const steps =
    type === "MISSING"
      ? [
          t("report.steps.who"),
          t("report.steps.where"),
          t("report.steps.description"),
          t("report.steps.photo"),
          t("report.steps.contact"),
        ]
      : [
          t("report.steps.who"),
          t("report.steps.where"),
          t("report.steps.description"),
          t("report.steps.photo"),
          t("report.steps.location"),
        ];

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
    language: localeToReportLanguage(locale),
    physicalDescription: "",
    lastSeenText: "",
    zoneId: "",
    reportingCenter: "",
    reporterPhone: "",
    state: "",
    district: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, language: localeToReportLanguage(locale) }));
  }, [locale]);

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
          ? t("report.voiceNotSupported")
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
      <div className="mx-auto max-w-lg px-6 py-10">
        <Card className="p-8 border border-black/[0.03] bg-white rounded-[32px] text-center space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{t("report.caseCreated")}</p>
            <h2 className="text-2xl font-extrabold text-khummela-text mt-1">{t("report.caseCreated")}</h2>
          </div>
          
          <div className="bg-black/[0.02] border border-black/[0.04] p-6 rounded-2xl">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-khummela-muted">{t("report.caseRef")}</span>
            <span className="font-mono text-3xl font-extrabold tracking-tight text-khummela-primary block mt-1.5">{doneRef}</span>
          </div>

          <p className="text-xs font-medium leading-relaxed text-khummela-muted max-w-sm mx-auto">
            Show this reference number to the help desk coordinators. The details are now shared across all active search kiosks.
          </p>

          <Button className="w-full mt-4" size="md" onClick={() => router.push("/")}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 pb-32">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-khummela-muted">
          Report {type === "MISSING" ? "Missing Case" : "Found Person"}
        </span>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-xs font-bold text-rose-500 hover:opacity-85 transition-opacity"
        >
          Cancel
        </button>
      </div>

      <StepWizard steps={steps} currentStep={step}>
        <div className="mt-8 bg-white border border-black/[0.03] p-6 rounded-[24px] shadow-[0_6px_20px_rgba(0,0,0,0.015)]">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="personName">Person&apos;s Full Name</Label>
                <Input
                  id="personName"
                  className="mt-2 h-11"
                  value={form.personName}
                  onChange={(e) => update({ personName: e.target.value })}
                  placeholder="Leave blank if unknown"
                />
              </div>
              <div>
                <Label>Age Bracket</Label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {AGE_BANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update({ ageBand: b })}
                      className={`h-10 rounded-full px-4 text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] border ${
                        form.ageBand === b
                          ? "bg-khummela-primary border-transparent text-white shadow-sm shadow-khummela-primary/10"
                          : "bg-black/[0.03] border-black/[0.05] text-khummela-text hover:bg-black/[0.06]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Gender</Label>
                <div className="mt-2.5 flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update({ gender: g })}
                      className={`h-10 flex-1 rounded-full text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] border ${
                        form.gender === g
                          ? "bg-khummela-primary border-transparent text-white shadow-sm shadow-khummela-primary/10"
                          : "bg-black/[0.03] border-black/[0.05] text-khummela-text hover:bg-black/[0.06]"
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
            <div className="space-y-5">
              <div>
                <Label>Assigned Arena / Zone</Label>
                <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1 border border-black/[0.05] rounded-xl p-2 bg-black/[0.01]">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => update({ zoneId: z.id, lastSeenText: z.name })}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                        form.zoneId === z.id
                          ? "bg-khummela-primary text-white"
                          : "bg-white border border-black/[0.04] text-khummela-text hover:bg-black/[0.02]"
                      }`}
                    >
                      <span>{z.name}</span>
                      <span className="opacity-60">{z.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="lastSeenText">Last Seen Specifics</Label>
                <Input
                  id="lastSeenText"
                  className="mt-2 h-11"
                  value={form.lastSeenText}
                  onChange={(e) => update({ lastSeenText: e.target.value })}
                  placeholder="e.g. Near Ramkund Ghat / Food Stalls"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label>Primary Speaking Language</Label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => update({ language: l })}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                        form.language === l
                          ? "bg-black text-white"
                          : "bg-black/[0.03] text-khummela-muted hover:bg-black/[0.06]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Physical Description</Label>
                  <button
                    type="button"
                    onClick={handleVoice}
                    disabled={transcribing}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 ${
                      listening || transcribing ? "text-khummela-primary" : "text-khummela-primary"
                    }`}
                  >
                    <Mic className={`h-3.5 w-3.5 ${listening ? "animate-bounce text-rose-500" : ""}`} />
                    {transcribing
                      ? t("report.voiceTranscribing")
                      : listening
                        ? t("report.voiceListening")
                        : t("report.voiceHint")}
                  </button>
                </div>
                <textarea
                  id="description"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] p-4 text-xs font-semibold placeholder:text-khummela-muted/70 transition-all duration-200 focus:border-khummela-primary focus:outline-none focus:ring-4 focus:ring-khummela-primary/10"
                  rows={4}
                  value={form.physicalDescription}
                  onChange={(e) => update({ physicalDescription: e.target.value })}
                  placeholder="Describe clothing, height, visible features..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-2">
              <PhotoUpload
                preview={photoPreview}
                onFileSelect={(file) => {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              {type === "MISSING" ? (
                <>
                  <div>
                    <Label htmlFor="reporterPhone">Reporter Mobile Number</Label>
                    <Input
                      id="reporterPhone"
                      className="mt-2 h-11"
                      type="tel"
                      value={form.reporterPhone}
                      onChange={(e) => update({ reporterPhone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportingCenter">Kiosk / Help Desk Name</Label>
                    <Input
                      id="reportingCenter"
                      className="mt-2 h-11"
                      value={form.reportingCenter}
                      onChange={(e) => update({ reportingCenter: e.target.value })}
                      placeholder="e.g. Center Gate 3"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="reportingCenter">Current Safe Location</Label>
                  <Input
                    id="reportingCenter"
                    className="mt-2 h-11"
                    value={form.reportingCenter}
                    onChange={(e) => update({ reportingCenter: e.target.value })}
                    placeholder="Where the person is safely waiting"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-rose-500/[0.08] border border-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}
        </div>
      </StepWizard>

      <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-black/[0.05] bg-white/80 p-2 shadow-[0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" size="sm" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              className="flex-1"
              size="sm"
              disabled={step === 0 && (!form.ageBand || !form.gender)}
              onClick={() => setStep(step + 1)}
            >
              {t("common.next")}
            </Button>
          ) : (
            <Button className="flex-1" size="sm" loading={loading} onClick={submit}>
              {t("report.submitReport")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
