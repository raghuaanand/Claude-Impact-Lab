"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useTranslation } from "@/components/i18n/LocaleProvider";

export function EmailSignUpForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.registrationFailed"));
        setLoading(false);
        return;
      }

      router.push("/signin?registered=email");
    } catch {
      setError(t("auth.registrationRetry"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-khummela-error/10 px-4 py-3 text-sm text-khummela-error">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="signup-name">{t("auth.fullName")}</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder={t("auth.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div>
        <Label htmlFor="signup-email">{t("auth.email")}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="signup-password">{t("auth.password")}</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder={t("auth.passwordNewPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        {t("auth.createAccount")}
      </Button>
    </form>
  );
}
