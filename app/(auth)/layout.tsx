import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile-only slim brand header — form appears immediately below */}
      <div className="flex items-center gap-3 border-b border-khummela-border bg-white px-5 py-3 lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-khummela-primary font-bold text-white">
            SC
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-khummela-text">Sangam Connect</p>
            <p className="mt-0.5 text-xs text-khummela-muted">Together we find hope</p>
          </div>
        </Link>
      </div>

      {/* Desktop-only left brand panel */}
      <div className="relative hidden flex-col justify-between bg-khummela-primary px-12 py-16 text-white lg:flex lg:w-2/5">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-khummela-accent font-bold text-lg">
              SC
            </div>
            <span className="text-xl font-semibold tracking-tight">Sangam Connect</span>
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Together we find hope
          </h1>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Sangam Connect helps communities identify and locate missing persons.
            Join our network of volunteers and coordinators working to reunite
            families.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-2xl font-bold text-khummela-hope">24/7</p>
              <p className="text-sm text-white/70">Community alerts</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-2xl font-bold text-khummela-hope">Secure</p>
              <p className="text-sm text-white/70">Protected data</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/50">
          Every person matters. Every search counts.
        </p>

        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Form area — full screen on mobile, right column on desktop */}
      <div className="flex flex-1 items-start justify-center px-6 py-8 lg:items-center lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
