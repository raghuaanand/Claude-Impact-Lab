import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "flex h-11 w-full rounded-lg border border-khummela-border bg-white px-4 text-sm text-khummela-text placeholder:text-khummela-muted transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-accent focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-khummela-error focus-visible:ring-khummela-error",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-khummela-error">{error}</p>
      )}
    </div>
  );
}
