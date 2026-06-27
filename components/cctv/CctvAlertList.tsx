"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type CctvAlertRow = {
  id: string;
  cameraId: string;
  zoneCode: string;
  zoneName: string;
  distanceMeters: number;
  status: string;
  sentAt: string | null;
};

type CctvAlertListProps = {
  caseId: string;
  caseType: string;
  canDispatch: boolean;
};

export function CctvAlertList({ caseId, caseType, canDispatch }: CctvAlertListProps) {
  const [alerts, setAlerts] = useState<CctvAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [message, setMessage] = useState("");

  function loadAlerts() {
    return fetch(`/api/cases/${caseId}/cctv-alerts`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []));
  }

  useEffect(() => {
    if (caseType !== "MISSING") {
      setLoading(false);
      return;
    }
    loadAlerts().finally(() => setLoading(false));
  }, [caseId, caseType]);

  async function dispatchAlerts() {
    setDispatching(true);
    setMessage("");
    const res = await fetch(`/api/cases/${caseId}/cctv-alerts`, { method: "POST" });
    const data = await res.json();
    setDispatching(false);

    if (res.ok) {
      setMessage(
        data.alerted > 0
          ? `Alert sent to ${data.alerted} nearby camera(s).`
          : "All nearby cameras already alerted."
      );
      loadAlerts();
    } else {
      setMessage(data.error ?? "Could not send CCTV alerts");
    }
  }

  if (caseType !== "MISSING") return null;

  return (
    <Card className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">CCTV lookout</h2>
          <p className="mt-1 text-sm text-khummela-muted">
            Nearby cameras around the last-seen zone are asked to review footage for this person.
          </p>
        </div>
        {canDispatch && (
          <Button
            size="sm"
            variant="secondary"
            loading={dispatching}
            onClick={dispatchAlerts}
          >
            {alerts.length > 0 ? "Re-alert cameras" : "Alert nearby CCTV"}
          </Button>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-khummela-accent">{message}</p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-khummela-muted">Loading camera alerts…</p>
      ) : alerts.length === 0 ? (
        <p className="mt-4 text-sm text-khummela-muted">
          No CCTV alerts yet. Supervisors can trigger alerts to cameras within ~500 m of the last-seen zone.
        </p>
      ) : (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl bg-khummela-surface px-3 py-2 text-sm"
            >
              <div>
                <p className="font-mono font-medium">{a.cameraId}</p>
                <p className="text-xs text-khummela-muted">
                  {a.zoneName} · {a.distanceMeters} m from last-seen area
                </p>
              </div>
              <CctvStatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CctvStatusBadge({ status }: { status: string }) {
  const variant =
    status === "SENT" || status === "ACKNOWLEDGED"
      ? "OPEN"
      : status === "REVIEWED"
        ? "RESOLVED"
        : "MATCH_PENDING";

  const label =
    status === "SENT"
      ? "Sent"
      : status === "ACKNOWLEDGED"
        ? "Ack"
        : status === "REVIEWED"
          ? "Reviewed"
          : status === "PENDING"
            ? "Pending"
            : status;

  return <Badge status={variant} label={label} />;
}
