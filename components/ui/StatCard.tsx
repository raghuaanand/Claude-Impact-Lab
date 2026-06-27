import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-6 bg-white hover:-translate-y-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-khummela-muted">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-khummela-text">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] font-medium text-khummela-muted/80">{hint}</p>}
    </Card>
  );
}

