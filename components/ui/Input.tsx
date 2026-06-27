import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "flex h-11 w-full rounded-[14px] border border-black/[0.08] bg-white px-4.5 text-sm text-khummela-text placeholder:text-khummela-muted/75 transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-khummela-primary/10 focus-visible:border-khummela-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-khummela-error focus-visible:ring-khummela-error",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-khummela-error">{error}</p>
      )}
    </div>
  );
}

