import { ReportPageHeader } from "@/components/report/ReportPageHeader";
import { ReportWizard } from "@/components/report/ReportWizard";

export default function ReportMissingPage() {
  return (
    <div className="min-h-full bg-khummela-bg pb-32">
      <ReportPageHeader type="MISSING" />
      <ReportWizard type="MISSING" />
    </div>
  );
}
