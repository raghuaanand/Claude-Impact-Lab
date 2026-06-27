"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, PlusCircle, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { Role } from "@/app/generated/prisma/client";

function navForRole(role: Role | undefined, t: ReturnType<typeof useTranslation>["t"]) {
  if (role === "FAMILY") {
    return [
      { href: "/report/status", label: t("nav.track"), icon: Home },
      { href: "/report/missing", label: t("nav.report"), icon: PlusCircle },
    ];
  }
  if (role === "POLICE") {
    return [
      { href: "/dashboard", label: t("nav.home"), icon: Home },
      { href: "/management", label: t("nav.command"), icon: Shield },
      { href: "/dashboard/search", label: t("common.search"), icon: Search },
    ];
  }
  if (role === "SUPERVISOR") {
    return [
      { href: "/dashboard", label: t("nav.home"), icon: Home },
      { href: "/management", label: t("nav.command"), icon: Shield },
      { href: "/dashboard/search", label: t("common.search"), icon: Search },
    ];
  }
  return [
    { href: "/dashboard", label: t("nav.home"), icon: Home },
    { href: "/report/missing", label: t("nav.report"), icon: PlusCircle },
    { href: "/dashboard/search", label: t("common.search"), icon: Search },
  ];
}

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const items = navForRole(session?.user?.role, t);

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-black/[0.05] bg-white/80 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex h-12 flex-1 flex-col items-center justify-center rounded-full text-[10px] font-semibold tracking-wide transition-all duration-200 apple-button-press",
                active ? "text-khummela-primary" : "text-khummela-muted hover:text-khummela-text"
              )}
            >
              {active && (
                <span className="absolute inset-0 -z-10 rounded-full bg-black/[0.03] scale-100 transition-transform duration-300" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
              <span className="mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

