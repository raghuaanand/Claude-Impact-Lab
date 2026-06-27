import { Button } from "./Button";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-khummela-surface text-khummela-accent">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-khummela-text">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-khummela-muted">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="mt-6" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
