"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/i18n/LocaleProvider";
import type { Role } from "@/app/generated/prisma/client";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  role: Role;
  zone: { id: string; name: string; code: string } | null;
};

type Zone = { id: string; name: string; code: string };

const ROLES: Role[] = ["FAMILY", "VOLUNTEER", "SUPERVISOR", "POLICE"];

export default function AdminPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const role = session?.user?.role ?? "POLICE";
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
    fetch("/api/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(userId: string, updates: { role?: Role; zoneId?: string | null }) {
    setSaving(userId);
    setMessage("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(null);
    if (res.ok) {
      setMessage(t("admin.userUpdated"));
      load();
    } else {
      const data = await res.json();
      setMessage(data.error ?? t("admin.updateFailed"));
    }
  }

  return (
    <AppShell title={t("nav.admin")} role={role} showNav={false}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-khummela-text md:text-4xl">{t("admin.title")}</h1>
          <p className="text-sm font-semibold text-khummela-muted leading-relaxed">{t("admin.subtitle")}</p>
        </header>

        {message && (
          <div className="mt-6 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-600">
            {message}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Link href="/management">
            <Button variant="outline" size="sm">{t("admin.commandCenterLink")}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">{t("admin.dashboardLink")}</Button>
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="p-5 border border-black/[0.03] bg-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-bold text-base tracking-tight text-khummela-text">
                    {user.name || user.email || user.mobile || t("common.user")}
                  </p>
                  <p className="text-xs font-semibold text-khummela-muted mt-0.5">
                    {user.email ?? user.mobile}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-khummela-muted/80 uppercase tracking-wide">
                    <span>{t("admin.roleLabel", { role: t(`roles.${user.role}`) })}</span>
                    {user.zone && (
                      <span>
                        · {t("admin.zoneLabel", { name: user.zone.name, code: user.zone.code })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="h-10 rounded-full border border-black/[0.08] bg-black/[0.03] px-4 text-xs font-bold text-khummela-text focus:bg-white focus:outline-none focus:ring-2 focus:ring-khummela-primary/20 transition-all cursor-pointer"
                    value={user.role}
                    disabled={saving === user.id}
                    onChange={(e) => updateUser(user.id, { role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`roles.${r}`)}
                      </option>
                    ))}
                  </select>
                  {user.role === "VOLUNTEER" && (
                    <select
                      className="h-10 rounded-full border border-black/[0.08] bg-black/[0.03] px-4 text-xs font-bold text-khummela-text focus:bg-white focus:outline-none focus:ring-2 focus:ring-khummela-primary/20 transition-all cursor-pointer"
                      value={user.zone?.id ?? ""}
                      disabled={saving === user.id}
                      onChange={(e) => updateUser(user.id, { zoneId: e.target.value || null })}
                    >
                      <option value="">{t("admin.noZone")}</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.code} — {z.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="mt-8 p-12 text-center border border-black/[0.03] bg-white rounded-3xl text-sm font-bold text-khummela-muted/60">
            {t("admin.noUsers")}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
