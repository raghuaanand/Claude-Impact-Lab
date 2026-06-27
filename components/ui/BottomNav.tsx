"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/report/missing", label: "Report", icon: PlusCircle },
  { href: "/dashboard/search", label: "Search", icon: Search },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-khummela-border bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
