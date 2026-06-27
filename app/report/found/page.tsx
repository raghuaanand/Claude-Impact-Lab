import { ReportPageHeader } from "@/components/report/ReportPageHeader";
import { ReportWizard } from "@/components/report/ReportWizard";

export default function ReportFoundPage() {
  return (
    <div className="min-h-full bg-khummela-bg pb-32">
      <ReportPageHeader type="FOUND" />
      <ReportWizard type="FOUND" />
    </div>
  );
}
