"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { roleLabel } from "@/lib/roles";
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

  async function updateUser(
    userId: string,
    updates: { role?: Role; zoneId?: string | null }
  ) {
    setSaving(userId);
    setMessage("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(null);
    if (res.ok) {
      setMessage("User updated");
      load();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Update failed");
    }
  }

  return (
    <AppShell title="Admin" role={role} showNav={false}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Police administration</h1>
        <p className="mt-1 text-sm text-khummela-muted">
          Manage roles and volunteer zone assignments
        </p>

        {message && (
          <p className="mt-4 text-sm text-khummela-success">{message}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Link href="/management" className="text-sm text-khummela-accent">
            Command center →
          </Link>
          <Link href="/dashboard" className="text-sm text-khummela-muted">
            Dashboard →
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-khummela-text">
                    {user.name || user.email || user.mobile || "User"}
                  </p>
                  <p className="text-sm text-khummela-muted">
                    {user.email ?? user.mobile}
                  </p>
                  <p className="mt-1 text-xs text-khummela-muted">
                    Current: {roleLabel(user.role)}
                    {user.zone ? ` · ${user.zone.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    className="h-11 rounded-lg border border-khummela-border px-3 text-sm"
                    value={user.role}
                    disabled={saving === user.id}
                    onChange={(e) =>
                      updateUser(user.id, { role: e.target.value as Role })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                  {user.role === "VOLUNTEER" && (
                    <select
                      className="h-11 rounded-lg border border-khummela-border px-3 text-sm"
                      value={user.zone?.id ?? ""}
                      disabled={saving === user.id}
                      onChange={(e) =>
                        updateUser(user.id, {
                          zoneId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">No zone</option>
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
          <Card className="mt-8 p-8 text-center text-sm text-khummela-muted">
            No users found
          </Card>
        )}
      </div>
    </AppShell>
  );
}
