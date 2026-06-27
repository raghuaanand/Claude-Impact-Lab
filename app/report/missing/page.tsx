import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportWizard } from "@/components/report/ReportWizard";

export default function ReportMissingPage() {
  return (
    <div className="min-h-full bg-khummela-bg pb-32">
      <div className="border-b border-khummela-border bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1 rounded text-sm text-khummela-accent hover:text-khummela-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-xl font-semibold text-khummela-text">
              Report missing person
            </h1>
            <p className="text-sm text-khummela-muted">
              Visible across all centers instantly
            </p>
          </div>
          {/* Spacer matches back-link width so title stays centred */}
          <div className="w-12 shrink-0" />
        </div>
      </div>
      <ReportWizard type="MISSING" />
    </div>
  );
}
