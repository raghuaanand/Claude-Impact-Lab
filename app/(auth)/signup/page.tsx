"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { EmailSignUpForm } from "@/components/auth/EmailSignUpForm";
import { MobileAuthForm } from "@/components/auth/MobileAuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const TABS = [
  { id: "email", label: "Email" },
  { id: "mobile", label: "Mobile" },
];

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState("email");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-khummela-text">Join KHUMMELA</h2>
        <p className="mt-2 text-khummela-muted">
          Create an account to help identify and locate missing persons
        </p>
      </div>

      <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />

      <div className="mt-6">
        {activeTab === "email" && <EmailSignUpForm />}
        {activeTab === "mobile" && <MobileAuthForm mode="signup" />}
      </div>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-khummela-border" />
        <span className="text-xs text-khummela-muted">or</span>
        <div className="h-px flex-1 bg-khummela-border" />
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-khummela-muted">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-khummela-primary hover:text-khummela-primary-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
