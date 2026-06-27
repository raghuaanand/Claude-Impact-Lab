import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const isManagement = session.user.role === "MANAGEMENT";

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white text-sm">
              K
            </div>
            <span className="font-semibold text-khummela-text">KHUMMELA</span>
          </Link>
          <div className="flex items-center gap-4">
            {isManagement && (
              <Link
                href="/management"
                className="text-sm font-medium text-khummela-primary hover:text-khummela-primary-dark"
              >
                Management
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-khummela-text">
            Welcome, {session.user.name || session.user.email || "Volunteer"}
          </h1>
          <p className="mt-2 text-khummela-muted">
            You are signed in as{" "}
            <span className="font-medium text-khummela-text">
              {session.user.role === "MANAGEMENT" ? "Management" : "Volunteer"}
            </span>
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-khummela-surface p-6">
              <p className="text-sm font-medium text-khummela-muted">Status</p>
              <p className="mt-1 text-lg font-semibold text-khummela-success">
                Active
              </p>
            </div>
            <div className="rounded-xl bg-khummela-surface p-6">
              <p className="text-sm font-medium text-khummela-muted">Role</p>
              <p className="mt-1 text-lg font-semibold text-khummela-text">
                {session.user.role}
              </p>
            </div>
            <div className="rounded-xl bg-khummela-surface p-6">
              <p className="text-sm font-medium text-khummela-muted">Session</p>
              <p className="mt-1 text-lg font-semibold text-khummela-text">
                24 hours
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm text-khummela-muted">
            Missing persons case management features will be available here.
          </p>
        </div>
      </main>
    </div>
  );
}
