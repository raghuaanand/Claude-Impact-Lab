"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { BottomNav } from "@/components/ui/BottomNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CctvAlertList } from "@/components/cctv/CctvAlertList";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { SafeCase } from "@/lib/case-access";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const id = params.id as string;
  const role = session?.user?.role;
  const isSupervisor = role === "SUPERVISOR" || role === "POLICE";
  const canUpdateCaseStatus =
    role === "VOLUNTEER" || role === "SUPERVISOR" || role === "POLICE";

  const [caseRecord, setCaseRecord] = useState<SafeCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function reload() {
    return fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((d) => setCaseRecord(d.case));
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [id]);

  async function recomputeMatches() {
    setBusy(true);
    setActionMsg("");
    const res = await fetch("/api/matches/recompute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foundCaseId: id }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setActionMsg(
        data.matches?.length
          ? t("caseDetail.matchesFound", { count: data.matches.length })
          : t("caseDetail.noMatches")
      );
      reload();
    } else {
      setActionMsg(data.error ?? t("caseDetail.recomputeFailed"));
    }
  }

  async function markResolved() {
    if (!confirm(t("caseDetail.confirmResolved"))) return;
    setBusy(true);
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setBusy(false);
    if (res.ok) {
      setActionMsg(t("caseDetail.markedResolved"));
      reload();
    } else {
      const data = await res.json();
      setActionMsg(data.error ?? t("caseDetail.resolveFailed"));
    }
  }

  async function markTransferred() {
    if (!confirm(t("caseDetail.confirmTransferred"))) return;
    setBusy(true);
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "TRANSFERRED" }),
    });
    setBusy(false);
    if (res.ok) {
      setActionMsg(t("caseDetail.markedTransferred"));
      reload();
    } else {
      const data = await res.json();
      setActionMsg(data.error ?? t("caseDetail.updateFailed"));
    }
  }

  if (loading) {
    return (
      <AppShell role={role}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Skeleton className="h-8 w-1/2 rounded-full" />
          <Skeleton className="mt-6 h-64 w-full rounded-[24px]" />
        </div>
        <BottomNav />
      </AppShell>
    );
  }

  if (!caseRecord) {
    return (
      <AppShell role={role}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-sm font-bold text-khummela-muted">{t("caseDetail.notFound")}</p>
        </div>
        <BottomNav />
      </AppShell>
    );
  }

  const caseTypeLabel =
    caseRecord.type === "MISSING"
      ? t("caseDetail.types.MISSING")
      : t("caseDetail.types.FOUND");

  return (
    <AppShell role={role}>
      <div className="mx-auto max-w-4xl px-6 py-10 lg:max-w-6xl">
        <Link href="/dashboard" className="text-xs font-bold text-khummela-primary transition-colors hover:text-khummela-primary-dark">
          {t("nav.backToDashboard")}
        </Link>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text md:text-4xl">
              {caseRecord.personName || t("common.unknownName")}
            </h1>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-khummela-muted mt-1">{caseRecord.caseRef}</p>
          </div>
          <Badge status={caseRecord.status} className="text-xs self-start" />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-black/[0.02] border border-black/[0.04] shadow-[0_6px_20px_rgba(0,0,0,0.015)]">
              {caseRecord.media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={caseRecord.media[0].cdnUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-7xl font-extrabold text-khummela-muted/30">
                  {(caseRecord.personName?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </div>

            <CctvAlertList caseId={caseRecord.id} caseType={caseRecord.type} canDispatch={isSupervisor} />
          </div>

          <div className="space-y-6">
            <Card className="p-6 border border-black/[0.03] bg-white rounded-[24px] space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-khummela-muted border-b border-black/[0.03] pb-3">
                {t("caseDetail.specifications")}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Row label={t("caseDetail.type")} value={caseTypeLabel} />
                <Row label={t("caseDetail.age")} value={caseRecord.ageBand} />
                <Row label={t("caseDetail.gender")} value={caseRecord.gender} />
                <Row label={t("caseDetail.language")} value={caseRecord.language} />
                <Row label={t("caseDetail.zone")} value={caseRecord.zoneName} />
                <Row label={t("caseDetail.lastSeen")} value={caseRecord.lastSeenText} />
                <Row label={t("caseDetail.center")} value={caseRecord.reportingCenter} />
                {caseRecord.reporterPhone && (
                  <Row label={t("caseDetail.contact")} value={caseRecord.reporterPhone} />
                )}
              </div>
              {caseRecord.physicalDescription && (
                <div className="border-t border-black/[0.03] pt-4">
                  <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">
                    {t("caseDetail.physicalDescription")}
                  </span>
                  <p className="text-xs text-khummela-text font-semibold mt-1.5 leading-relaxed">{caseRecord.physicalDescription}</p>
                </div>
              )}
              {caseRecord.remarks && isSupervisor && (
                <div className="border-t border-black/[0.03] pt-4">
                  <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">
                    {t("caseDetail.supervisorRemarks")}
                  </span>
                  <p className="text-xs text-khummela-text font-semibold mt-1.5 leading-relaxed">{caseRecord.remarks}</p>
                </div>
              )}
            </Card>

            {actionMsg && (
              <div className="rounded-2xl bg-khummela-primary/[0.08] border border-khummela-primary/10 px-4 py-3 text-xs font-bold text-khummela-primary">
                {actionMsg}
              </div>
            )}

            <div className="space-y-3">
              {caseRecord.type === "FOUND" && ["OPEN", "MATCH_PENDING"].includes(caseRecord.status) && (
                <Button className="w-full" size="lg" loading={busy} onClick={recomputeMatches}>
                  {t("caseDetail.runMatchSearch")}
                </Button>
              )}

              {caseRecord.status === "MATCH_PENDING" && isSupervisor && (
                <Button className="w-full" size="lg" onClick={() => router.push("/management")}>
                  {t("caseDetail.reviewInCommand")}
                </Button>
              )}

              {canUpdateCaseStatus &&
                !["RESOLVED", "DUPLICATE", "TRANSFERRED", "UNRESOLVED"].includes(caseRecord.status) && (
                  <Button className="w-full" size="lg" variant="outline" loading={busy} onClick={markTransferred}>
                    {t("caseDetail.markTransferred")}
                  </Button>
                )}

              {isSupervisor && !["RESOLVED", "DUPLICATE", "TRANSFERRED"].includes(caseRecord.status) && (
                <Button className="w-full" size="lg" variant="outline" loading={busy} onClick={markResolved}>
                  {t("caseDetail.markResolved")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border-b border-black/[0.03] pb-3 last:border-0 last:pb-0">
      <span className="block text-[9px] uppercase tracking-wider text-khummela-muted/75 font-bold">{label}</span>
      <span className="text-khummela-text text-xs font-bold block mt-0.5">{value}</span>
    </div>
  );
}
