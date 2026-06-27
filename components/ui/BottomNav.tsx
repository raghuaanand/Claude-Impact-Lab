"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, PlusCircle, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/app/generated/prisma/client";

function navForRole(role?: Role) {
  if (role === "FAMILY") {
    return [
      { href: "/report/status", label: "Track", icon: Home },
      { href: "/report/missing", label: "Report", icon: PlusCircle },
    ];
  }
  if (role === "POLICE") {
    return [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/management", label: "Command", icon: Shield },
      { href: "/dashboard/search", label: "Search", icon: Search },
    ];
  }
  if (role === "SUPERVISOR") {
    return [
      { href: "/dashboard", label: "Home", icon: Home },
      { href: "/management", label: "Command", icon: Shield },
      { href: "/dashboard/search", label: "Search", icon: Search },
    ];
  }
  return [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/report/missing", label: "Report", icon: PlusCircle },
    { href: "/dashboard/search", label: "Search", icon: Search },
  ];
}

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = navForRole(session?.user?.role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-khummela-border bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium transition-colors",
                active ? "text-khummela-primary" : "text-khummela-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
