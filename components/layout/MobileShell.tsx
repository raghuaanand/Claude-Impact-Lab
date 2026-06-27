import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { RoleBadge } from "@/components/ui/RoleBadge";
import type { Role } from "@/app/generated/prisma/client";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  role?: Role;
  showNav?: boolean;
};

export function AppShell({
  children,
  title = "Sangam Connect",
  role,
  showNav = true,
}: AppShellProps) {
  const isSupervisor = role === "SUPERVISOR" || role === "POLICE";
  const isPolice = role === "POLICE";

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="sticky top-0 z-40 border-b border-khummela-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 lg:max-w-6xl lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-khummela-primary text-sm font-bold text-white">
              SC
            </div>
            <div>
              <span className="font-semibold text-khummela-text">{title}</span>
              {role && (
                <div className="mt-0.5">
                  <RoleBadge role={role} />
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isSupervisor && (
              <Link
                href="/management"
                className="text-sm font-medium text-khummela-primary"
              >
                Command
              </Link>
            )}
            {isPolice && (
              <Link
                href="/admin"
                className="text-sm font-medium text-khummela-error"
              >
                Admin
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

/** @deprecated use AppShell */
export const MobileShell = AppShell;
