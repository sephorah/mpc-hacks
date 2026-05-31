import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Background Grid & Glow ────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow)_0%,transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-muted) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Hero Content ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 py-24 text-center max-w-4xl animate-fade-in">
        {/* Badge */}
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          MPC Hacks 2026 — Dialogue Challenge
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          <span className="text-text-primary">Virtual Care,</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Zero Wait Time
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg sm:text-xl text-text-secondary leading-relaxed">
          AI-powered asynchronous care that lets one clinician safely manage
          hundreds of patients daily — with every medical decision made by a
          licensed practitioner.
        </p>

        {/* ── CTA Cards ──────────────────────────────────────── */}
        <div className="mt-4 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/patient"
            className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface-glass p-8 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform duration-300 group-hover:scale-110">
              🏥
            </div>
            <span className="text-lg font-semibold text-text-primary">
              I&apos;m a Patient
            </span>
            <span className="text-sm text-text-secondary">
              Submit a care request
            </span>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>

          <Link
            href="/provider"
            className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface-glass p-8 backdrop-blur-xl transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-3xl transition-transform duration-300 group-hover:scale-110">
              👨‍⚕️
            </div>
            <span className="text-lg font-semibold text-text-primary">
              I&apos;m a Provider
            </span>
            <span className="text-sm text-text-secondary">
              Review & attest cases
            </span>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>

        {/* ── Feature Highlights ──────────────────────────────── */}
        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "Batch Processing",
              desc: "Cohort similar cases for rapid batch review by clinicians.",
            },
            {
              icon: "🛡️",
              title: "Safety Layers",
              desc: "Dual-layer validation ensures no red flags slip through.",
            },
            {
              icon: "🔄",
              title: "Async Care",
              desc: "Replace wait-heavy consults with structured async workflows.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-surface/50 p-6 text-center animate-slide-up"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm font-semibold text-text-primary">
                {f.title}
              </span>
              <span className="text-xs text-text-muted leading-relaxed">
                {f.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
