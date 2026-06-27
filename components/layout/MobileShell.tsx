import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

type MobileShellProps = {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
  managementLink?: boolean;
};

export function MobileShell({
  children,
  title = "Sangam Connect",
  showNav = true,
  managementLink = false,
}: MobileShellProps) {
  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="sticky top-0 z-40 border-b border-khummela-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 lg:max-w-6xl lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-khummela-primary text-sm font-bold text-white">
              SC
            </div>
            <span className="font-semibold text-khummela-text">{title}</span>
          </Link>
          <div className="flex items-center gap-3">
            {managementLink && (
              <Link
                href="/management"
                className="text-sm font-medium text-khummela-primary"
              >
                Command
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className={showNav ? "pb-24" : ""}>{children}</main>
    </div>
  );
}
