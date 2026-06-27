"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/LocaleProvider";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
}: SearchBarProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("search.placeholder");
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4.5 top-1/2 h-4 w-4 -translate-y-1/2 text-khummela-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="h-12 w-full rounded-full border border-black/[0.06] bg-black/[0.03] pl-11 pr-10 text-sm tracking-wide transition-all duration-300 placeholder:text-khummela-muted/80 focus:border-khummela-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-khummela-primary/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-4.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-khummela-muted transition-colors hover:bg-black/[0.05] hover:text-khummela-text"
          aria-label={t("common.clearSearch")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

