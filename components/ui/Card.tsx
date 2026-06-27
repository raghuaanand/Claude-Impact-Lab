import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] bg-white p-6 border border-black/[0.04] shadow-[0_6px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
