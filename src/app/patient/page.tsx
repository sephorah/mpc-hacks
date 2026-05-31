import Link from "next/link";
import { GlassCard } from "@/app/_components/GlassCard";

export default function PatientHome() {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* ── Heading ──────────────────────────────────────────── */}
      <div className="text-center animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
          How can we help you today?
        </h1>
        <p className="mt-3 text-text-secondary text-base">
          Select the type of care you need. We&apos;ll guide you through a quick intake form.
        </p>
      </div>

      {/* ── Service Cards ────────────────────────────────────── */}
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {/* Medication Renewal */}
        <Link
          href="/patient/intake?service=RENEWAL"
          className="animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <GlassCard hover className="group h-full flex flex-col items-center gap-4 text-center cursor-pointer">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl transition-transform duration-300 group-hover:scale-110">
              💊
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Medication Renewal
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                Refill an existing prescription — no office visit needed. Fast,
                safe, and clinician-approved.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Get started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>

        {/* Lab Follow-up */}
        <Link
          href="/patient/intake?service=LAB_FOLLOW_UP"
          className="animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <GlassCard hover className="group h-full flex flex-col items-center gap-4 text-center cursor-pointer">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-4xl transition-transform duration-300 group-hover:scale-110">
              🔬
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Lab Follow-up
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                Get your lab results reviewed asynchronously by your care team.
                Quick turnaround, clear guidance.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Get started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* ── Trust Badge ──────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 text-xs text-text-muted animate-fade-in"
        style={{ animationDelay: "400ms" }}
      >
        <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        End-to-end encrypted · HIPAA compliant · Clinician-attested
      </div>
    </div>
  );
}
