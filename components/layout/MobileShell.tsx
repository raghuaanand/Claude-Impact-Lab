"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { Role } from "@/app/generated/prisma/client";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  role?: Role;
  showNav?: boolean;
};

export function AppShell({
  children,
  title,
  role,
  showNav = true,
}: AppShellProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("common.appName");
  const isSupervisor = role === "SUPERVISOR" || role === "POLICE";
  const isPolice = role === "POLICE";

  return (
    <div className="min-h-full bg-khummela-bg pb-12">
      <header className="sticky top-0 z-40 apple-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white shadow-sm">
              SC
            </div>
            <div>
              <span className="font-semibold tracking-tight text-khummela-text text-base lg:text-lg">{displayTitle}</span>
              {role && (
                <div className="mt-0.5 flex items-center">
                  <RoleBadge role={role} />
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {isSupervisor && (
              <Link
                href="/management"
                className="text-sm font-medium text-khummela-primary transition-colors hover:text-khummela-primary-dark"
              >
                {t("nav.command")}
              </Link>
            )}
            {isPolice && (
              <Link
                href="/admin"
                className="text-sm font-medium text-khummela-error transition-colors hover:opacity-80"
              >
                {t("nav.admin")}
              </Link>
            )}
            <div className="h-4 w-px bg-black/[0.08]" />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className={showNav ? "pb-28" : ""}>{children}</main>
    </div>
  );
}

/** @deprecated use AppShell */
export const MobileShell = AppShell;
