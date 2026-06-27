import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "mb-2 block text-[10px] font-bold uppercase tracking-wider text-khummela-muted/90",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

