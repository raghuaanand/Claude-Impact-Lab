"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useTranslation } from "@/components/i18n/LocaleProvider";

type MobileSignInFormProps = {
  mode?: "signin" | "signup";
};

export function MobileAuthForm({ mode = "signin" }: MobileSignInFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const purpose = mode === "signup" ? "signup" : "login";

  const sendOtp = async () => {
    setError("");
    setSendingOtp(true);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, purpose }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.otpSendFailed"));
        setSendingOtp(false);
        return;
      }

      setOtpSent(true);
      setSendingOtp(false);
    } catch {
      setError(t("auth.otpSendRetry"));
      setSendingOtp(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authMethod === "password") {
      const result = await signIn("mobile-password", {
        mobile,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError(t("auth.invalidMobilePassword"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const result = await signIn("mobile-otp", {
      mobile,
      otp,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("auth.invalidOtp"));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mobile", name, mobile, password, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.registrationFailed"));
        setLoading(false);
        return;
      }

      const signInResult = await signIn("mobile-password", {
        mobile,
        password,
        redirect: false,
      });

      setLoading(false);

      if (signInResult?.error) {
        router.push("/signin?registered=mobile");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("auth.registrationRetry"));
      setLoading(false);
    }
  };

  const handleSubmit = mode === "signup" ? handleSignUp : handleSignIn;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-khummela-error/10 px-4 py-3 text-sm text-khummela-error">
          {error}
        </div>
      )}

      {mode === "signup" && (
        <div>
          <Label htmlFor="mobile-name">{t("auth.fullName")}</Label>
          <Input
            id="mobile-name"
            type="text"
            placeholder={t("auth.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
      )}

      <div>
        <Label htmlFor="mobile-number">{t("auth.mobileNumber")}</Label>
        <Input
          id="mobile-number"
          type="tel"
          placeholder={t("auth.mobilePlaceholder")}
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value);
            setOtpSent(false);
          }}
          required
          autoComplete="tel"
        />
      </div>

      {mode === "signin" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAuthMethod("password")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              authMethod === "password"
                ? "bg-khummela-primary text-white"
                : "bg-khummela-surface text-khummela-muted hover:text-khummela-text"
            }`}
          >
            {t("auth.password")}
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("otp")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              authMethod === "otp"
                ? "bg-khummela-primary text-white"
                : "bg-khummela-surface text-khummela-muted hover:text-khummela-text"
            }`}
          >
            {t("auth.otp")}
          </button>
        </div>
      )}

      {(mode === "signup" || authMethod === "password") && (
        <div>
          <Label htmlFor="mobile-password">{t("auth.password")}</Label>
          <Input
            id="mobile-password"
            type="password"
            placeholder={t("auth.passwordNewPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
      )}

      {(mode === "signup" || authMethod === "otp") && (
        <div>
          <Label htmlFor="mobile-otp">{t("auth.verificationCode")}</Label>
          <div className="flex gap-2">
            <Input
              id="mobile-otp"
              type="text"
              placeholder={t("auth.otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button
              type="button"
              variant="outline"
              onClick={sendOtp}
              loading={sendingOtp}
              disabled={!mobile}
              className="shrink-0"
            >
              {otpSent ? t("auth.resendOtp") : t("auth.sendOtp")}
            </Button>
          </div>
          {otpSent && (
            <p className="mt-1.5 text-xs text-khummela-muted">{t("auth.otpSent")}</p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        {mode === "signup" ? t("auth.createAccount") : t("common.signIn")}
      </Button>
    </form>
  );
}
