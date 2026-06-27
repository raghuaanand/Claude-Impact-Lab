import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-khummela-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-khummela-text">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-khummela-muted">{hint}</p>}
    </Card>
  );
}
