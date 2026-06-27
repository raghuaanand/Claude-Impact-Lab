"use client";

import { cn } from "@/lib/utils";

type AuthTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
};

export function AuthTabs({ activeTab, onTabChange, tabs }: AuthTabsProps) {
  return (
    <div role="tablist" className="flex rounded-lg bg-khummela-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khummela-accent focus-visible:ring-offset-1",
            activeTab === tab.id
              ? "bg-white text-khummela-primary shadow-sm"
              : "text-khummela-muted hover:text-khummela-text"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
