import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-full bg-khummela-bg">
      <header className="border-b border-khummela-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-khummela-primary font-bold text-white">
              SC
            </div>
            <span className="text-xl font-semibold text-khummela-text">
              Sangam Connect
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
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
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
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-khummela-accent">
              Kumbh Mela 2027 · Nashik-Trimbakeshwar
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-khummela-text sm:text-5xl">
              Every person matters.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-khummela-muted">
              Sangam Connect unifies missing and found reports across all Khoya-Paaya
              centers — so a family searching at one booth can find a match registered
              anywhere on the grounds.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/report/missing">
                <Button size="lg" className="min-w-[220px]">
                  Report missing person
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="lg" className="min-w-[220px]">
                  Volunteer sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-khummela-border bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            {[
              {
                title: "Cross-center search",
                body: "One registry for every reporting center. No more invisible cases.",
              },
              {
                title: "Human-verified matches",
                body: "AI suggests — supervisors approve. No automatic reunification.",
              },
              {
                title: "Built for the ground",
                body: "Mobile-first for volunteers helping pilgrims without smartphones.",
              },
            ].map((item) => (
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
