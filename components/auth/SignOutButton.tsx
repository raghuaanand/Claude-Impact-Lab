"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/LocaleProvider";

export function SignOutButton() {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/signin" })}
    >
      {t("common.signOut")}
    </Button>
  );
}
