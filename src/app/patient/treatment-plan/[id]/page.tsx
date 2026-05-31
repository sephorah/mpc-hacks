import { getTreatmentPlan } from "@/db";
import Link from "next/link";
import { GlassCard } from "@/app/_components/GlassCard";

export default async function TreatmentPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const treatmentPlan = getTreatmentPlan(id);

  if (!treatmentPlan) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-3xl">
          🔒
        </div>
        <h1 className="text-xl font-semibold text-text-primary">
          Treatment Plan Not Found
        </h1>
        <p className="text-sm text-text-secondary">
          This treatment plan could not be securely retrieved from the database.
        </p>
        <Link
          href={`/patient/thread/${id}`}
          className="mt-4 text-sm font-medium text-primary hover:text-primary-light transition-colors"
        >
          ← Back to Case Thread
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-fade-in py-8 px-4 sm:px-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            href={`/patient/thread/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Case Thread
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Official Care Plan
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <p className="text-sm text-text-muted">
              Securely retrieved from local database
            </p>
          </div>
        </div>
      </div>

      {/* ── Document Body ───────────────────────────────── */}
      <div className="relative mt-4">
        <div className="absolute inset-0 bg-gradient-to-b from-success/10 to-transparent rounded-[2rem] blur-xl -z-10" />
        <div className="relative border border-white/[0.08] bg-surface-glass backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl">
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8 border-b border-white/[0.08]">
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                Patient Name
              </h2>
              <p className="text-xl font-bold text-text-primary">{treatmentPlan.patient_name}</p>
            </div>
            <div className="flex gap-8">
              <div>
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                  Date
                </h2>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {new Date(treatmentPlan.approved_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                  Case ID
                </h2>
                <p className="text-sm font-medium text-text-primary font-mono">
                  {id.split("-")[0].toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Condition / Service */}
          <div className="py-8 border-b border-white/[0.08] grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                Service Type
              </h2>
              <p className="text-base font-semibold text-primary">{treatmentPlan.service_type}</p>
            </div>
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                Medication / Focus
              </h2>
              <p className="text-base font-semibold text-text-primary">{treatmentPlan.condition_key}</p>
            </div>
          </div>

          {/* Clinical Plan Notes */}
          <div className="py-8 border-b border-white/[0.08]">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
              Physician&apos;s Plan
            </h2>
            <div className="rounded-2xl bg-surface-elevated/40 p-6 sm:p-8 border border-white/[0.04]">
              <p className="text-lg text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
                {treatmentPlan.treatment_plan}
              </p>
            </div>
          </div>

          {/* Sign off */}
          <div className="pt-8 flex justify-end">
            <div className="text-right">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                Electronically Signed By
              </h2>
              <p className="text-2xl font-signature text-success italic mb-1">
                {treatmentPlan.doctor_name}
              </p>
              <p className="text-sm text-text-muted">
                Authorized Prescriber
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
