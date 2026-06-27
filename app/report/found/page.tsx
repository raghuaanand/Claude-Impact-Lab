import { ReportWizard } from "@/components/report/ReportWizard";

export default function ReportFoundPage() {
  return (
    <div className="min-h-full bg-khummela-bg pb-32">
      <div className="border-b border-khummela-border bg-white px-4 py-4">
        <h1 className="text-center text-xl font-semibold text-khummela-text">
          Register found person
        </h1>
        <p className="mt-1 text-center text-sm text-khummela-muted">
          We&apos;ll check against all open missing cases
        </p>
      </div>
      <ReportWizard type="FOUND" />
    </div>
  );
}
