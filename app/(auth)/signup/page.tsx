"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { EmailSignUpForm } from "@/components/auth/EmailSignUpForm";
import { MobileAuthForm } from "@/components/auth/MobileAuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useTranslation } from "@/components/i18n/LocaleProvider";

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState("email");
  const { t } = useTranslation();

  const tabs = [
    { id: "email", label: t("auth.emailTab") },
    { id: "mobile", label: t("auth.mobileTab") },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-khummela-text">{t("auth.joinTitle")}</h2>
        <p className="mt-2 text-khummela-muted">{t("auth.joinSubtitle")}</p>
      </div>

      <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      <div className="mt-6">
        {activeTab === "email" && <EmailSignUpForm />}
        {activeTab === "mobile" && <MobileAuthForm mode="signup" />}
      </div>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-khummela-border" />
        <span className="text-xs text-khummela-muted">{t("common.or")}</span>
        <div className="h-px flex-1 bg-khummela-border" />
      </div>

      <GoogleSignInButton label={t("auth.googleSignUp")} />

      <p className="mt-8 text-center text-sm text-khummela-muted">
        {t("auth.hasAccount")}{" "}
        <Link
          href="/signin"
          className="font-medium text-khummela-primary hover:text-khummela-primary-dark"
        >
          {t("auth.signInInstead")}
        </Link>
      </p>
    </div>
  );
}
