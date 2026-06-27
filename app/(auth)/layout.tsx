import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <div className="relative flex flex-col justify-between bg-khummela-primary px-8 py-10 text-white lg:w-2/5 lg:px-12 lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-khummela-accent font-bold text-lg">
              K
            </div>
            <span className="text-xl font-semibold tracking-tight">KHUMMELA</span>
          </Link>
        </div>

        <div className="my-12 lg:my-0">
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            Together we find hope
          </h1>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            KHUMMELA helps communities identify and locate missing persons.
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
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
