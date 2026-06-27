"use client";

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/LocaleProvider";

type PhotoUploadProps = {
  preview?: string | null;
  onFileSelect: (file: File) => void;
  className?: string;
};

export function PhotoUpload({ preview, onFileSelect, className }: PhotoUploadProps) {
  const { t } = useTranslation();
  return (
    <label
      className={cn(
        "flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-khummela-border bg-khummela-surface/50 transition-colors hover:border-khummela-accent hover:bg-khummela-accent/5",
        preview && "border-solid p-0",
        className
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={t("photo.preview")} className="h-full w-full rounded-2xl object-cover" />
      ) : (
        <>
          <Camera className="h-8 w-8 text-khummela-accent" />
          <span className="mt-2 text-sm font-medium text-khummela-text">{t("photo.addPhoto")}</span>
          <span className="text-xs text-khummela-muted">{t("photo.tapToUpload")}</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </label>
  );
}
