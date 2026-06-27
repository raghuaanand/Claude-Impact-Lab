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
          <div key={step} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                i <= currentStep
                  ? "bg-khummela-primary text-white"
                  : "bg-khummela-surface text-khummela-muted"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-center text-xs sm:block",
                i === currentStep ? "font-medium text-khummela-text" : "text-khummela-muted"
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-khummela-surface">
        <div
          className="h-full rounded-full bg-khummela-primary transition-all duration-300 ease-out"
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
