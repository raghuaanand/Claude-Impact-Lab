"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import { MobileAuthForm } from "@/components/auth/MobileAuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const TABS = [
  { id: "email", label: "Email" },
  { id: "mobile", label: "Mobile" },
];

export default function SignInContent() {
  const [activeTab, setActiveTab] = useState("email");
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-khummela-text">Welcome back</h2>
        <p className="mt-2 text-khummela-muted">
          Sign in to continue helping find missing persons
        </p>
      </div>

      {registered && (
        <div className="mb-6 rounded-lg bg-khummela-success/10 px-4 py-3 text-sm text-khummela-success">
          Account created successfully. Please sign in.
        </div>
      )}

      <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />

      <div className="mt-6">
        {activeTab === "email" && <EmailSignInForm />}
        {activeTab === "mobile" && <MobileAuthForm mode="signin" />}
      </div>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-khummela-border" />
        <span className="text-xs text-khummela-muted">or</span>
        <div className="h-px flex-1 bg-khummela-border" />
      </div>

      <GoogleSignInButton />

      <p className="mt-8 text-center text-sm text-khummela-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-khummela-primary hover:text-khummela-primary-dark"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
