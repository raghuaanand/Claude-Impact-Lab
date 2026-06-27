import { cn } from "@/lib/utils";

type StepWizardProps = {
  steps: string[];
  currentStep: number;
  children: React.ReactNode;
};

export function StepIndicator({ steps, currentStep }: Pick<StepWizardProps, "steps" | "currentStep">) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                i <= currentStep
                  ? "bg-khummela-primary text-white shadow-sm shadow-khummela-primary/10"
                  : "bg-black/[0.04] text-khummela-muted"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-center text-[10px] font-bold tracking-wide uppercase sm:block",
                i === currentStep ? "text-khummela-text" : "text-khummela-muted/65"
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-black/[0.04]">
        <div
          className="h-full rounded-full bg-khummela-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}


export function StepWizard({ steps, currentStep, children }: StepWizardProps) {
  return (
    <div>
      <StepIndicator steps={steps} currentStep={currentStep} />
      {children}
    </div>
  );
}
