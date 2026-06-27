import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white">
              K
            </div>
            <span className="text-xl font-semibold text-khummela-text">
              KHUMMELA
            </span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Join us</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-khummela-accent">
              Missing Persons Identification
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-khummela-text sm:text-5xl">
              Together we find hope
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-khummela-muted">
              KHUMMELA connects communities, volunteers, and coordinators to
              identify and locate missing persons. Every alert, every search,
              every shared detail brings families closer to reunion.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {!session && (
                <>
                  <Link href="/signup">
                    <Button size="lg">Get started</Button>
                  </Link>
                  <Link href="/signin">
                    <Button variant="outline" size="lg">Sign in</Button>
                  </Link>
                </>
              )}
              {session && (
                <Link href="/dashboard">
                  <Button size="lg">Go to dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-khummela-border bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-khummela-primary/10 text-khummela-primary font-bold">
                1
              </div>
              <h3 className="mt-4 font-semibold text-khummela-text">
                Report &amp; Alert
              </h3>
              <p className="mt-2 text-sm text-khummela-muted">
                Submit missing person reports and broadcast community alerts
                instantly.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-khummela-accent/10 text-khummela-accent font-bold">
                2
              </div>
              <h3 className="mt-4 font-semibold text-khummela-text">
                Coordinate Search
              </h3>
              <p className="mt-2 text-sm text-khummela-muted">
                Volunteers and management teams coordinate search efforts in
                real time.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-khummela-hope/10 text-khummela-hope font-bold">
                3
              </div>
              <h3 className="mt-4 font-semibold text-khummela-text">
                Reunite Families
              </h3>
              <p className="mt-2 text-sm text-khummela-muted">
                Verified identifications help bring missing loved ones home
                safely.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-khummela-border py-8 text-center text-sm text-khummela-muted">
        KHUMMELA — Every person matters. Every search counts.
      </footer>
    </div>
  );
}
