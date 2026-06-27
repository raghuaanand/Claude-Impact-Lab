"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { MobileAuthForm } from "@/components/auth/MobileAuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useTranslation } from "@/components/i18n/LocaleProvider";

export default function SignInContent() {
  const [activeTab, setActiveTab] = useState("email");
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const { t } = useTranslation();

  const tabs = [
    { id: "email", label: t("auth.emailTab") },
    { id: "mobile", label: t("auth.mobileTab") },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-khummela-text">{t("auth.welcomeBack")}</h2>
        <p className="mt-2 text-khummela-muted">{t("auth.signInSubtitle")}</p>
      </div>

      {registered && (
        <div className="mb-6 rounded-lg bg-khummela-success/10 px-4 py-3 text-sm text-khummela-success">
          {t("auth.accountCreated")}
        </div>
      )}

      <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      <div className="mt-6">
        {activeTab === "email" && <EmailSignInForm />}
        {activeTab === "mobile" && <MobileAuthForm mode="signin" />}
      </div>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-khummela-border" />
        <span className="text-xs text-khummela-muted">{t("common.or")}</span>
        <div className="h-px flex-1 bg-khummela-border" />
      </div>

      <GoogleSignInButton />

      <p className="mt-8 text-center text-sm text-khummela-muted">
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-khummela-primary hover:text-khummela-primary-dark"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
