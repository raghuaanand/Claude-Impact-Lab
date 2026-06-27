"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useTranslation } from "@/components/i18n/LocaleProvider";

export function HomePage() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const features = [
    {
      title: t("home.featureCrossCenterTitle"),
      body: t("home.featureCrossCenterBody"),
    },
    {
      title: t("home.featureVerifiedTitle"),
      body: t("home.featureVerifiedBody"),
    },
    {
      title: t("home.featureGroundTitle"),
      body: t("home.featureGroundBody"),
    },
  ];

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-khummela-primary font-bold text-white">
              SC
            </div>
            <span className="text-xl font-semibold text-khummela-text">
              {t("common.appName")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {session ? (
              <Link
                href={
                  session.user.role === "FAMILY"
                    ? "/report/status"
                    : "/dashboard"
                }
              >
                <Button size="sm">
                  {session.user.role === "FAMILY"
                    ? t("nav.myCases")
                    : t("nav.dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    {t("common.signIn")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">{t("common.joinUs")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-khummela-accent">
              {t("home.tagline")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-khummela-text sm:text-5xl">
              {t("home.headline")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-khummela-muted">
              {t("home.description")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/report/missing">
                <Button size="lg" className="min-w-[220px]">
                  {t("home.reportMissing")}
                </Button>
              </Link>
              <Link href="/report/status">
                <Button variant="outline" size="lg" className="min-w-[220px]">
                  {t("home.trackStatus")}
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-khummela-muted">
              {t("home.staffSignIn")}{" "}
              <Link href="/signin" className="text-khummela-accent underline">
                {t("home.staffSignInLink")}
              </Link>
            </p>
          </div>
        </section>

        <section className="border-t border-khummela-border bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-khummela-bg p-8 ring-1 ring-black/5"
              >
                <h3 className="text-lg font-semibold text-khummela-text">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-khummela-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
