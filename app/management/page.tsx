import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function ManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "MANAGEMENT") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white text-sm">
              K
            </div>
            <span className="font-semibold text-khummela-text">KHUMMELA</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-khummela-text">
            Management Dashboard
          </h1>
          <p className="mt-2 text-khummela-muted">
            Administrative tools for coordinating missing persons cases and
            volunteer management.
          </p>

          <div className="mt-8 rounded-xl border border-khummela-accent/30 bg-khummela-accent/5 p-6">
            <p className="font-medium text-khummela-text">Management access</p>
            <p className="mt-1 text-sm text-khummela-muted">
              You have elevated permissions to manage cases, users, and system
              settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
