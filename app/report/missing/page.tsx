import { ReportWizard } from "@/components/report/ReportWizard";

export default function ReportMissingPage() {
  return (
    <div className="min-h-full bg-khummela-bg pb-32">
      <div className="border-b border-khummela-border bg-white px-4 py-4">
        <h1 className="text-center text-xl font-semibold text-khummela-text">
          Report missing person
        </h1>
        <p className="mt-1 text-center text-sm text-khummela-muted">
          Visible across all centers instantly
        </p>
      </div>
      <ReportWizard type="MISSING" />
    </div>
  );
}
