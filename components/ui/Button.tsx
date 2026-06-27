import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-khummela-primary text-white hover:bg-[#007bf3] shadow-sm hover:shadow-[0_4px_16px_rgba(0,113,227,0.25)]",
    secondary:
      "bg-khummela-accent text-white hover:bg-khummela-accent-dark shadow-sm hover:shadow-[0_4px_16px_rgba(29,29,31,0.25)]",
    outline:
      "border border-black/[0.12] text-khummela-text bg-white hover:bg-black/[0.02] hover:border-black/[0.18]",
    ghost: "text-khummela-text hover:bg-black/[0.04] hover:text-black",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs font-semibold tracking-wide",
    md: "h-11 px-5 text-sm font-semibold tracking-wide",
    lg: "h-12 px-7 text-sm font-semibold tracking-wide",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-primary/40 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

