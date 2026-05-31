import { getState } from "@/state";
import { getTreatmentPlan } from "@/db";
import { GlassCard } from "@/app/_components/GlassCard";
import { StatusPill } from "@/app/_components/StatusPill";
import { Timeline } from "@/app/_components/Timeline";
import { SafetyFlagBadge } from "@/app/_components/SafetyFlagBadge";
import { CaseStatus, MedicalServiceType } from "@/domain";
import Link from "next/link";

function formatServiceType(type: MedicalServiceType): string {
  switch (type) {
    case MedicalServiceType.RENEWAL:
      return "Medication Renewal";
    case MedicalServiceType.LAB_FOLLOW_UP:
      return "Lab Follow-up";
    case MedicalServiceType.CHRONIC_CHECK_IN:
      return "Chronic Check-in";
    default:
      return type;
  }
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = getState();
  const patientCase = state.getCase(id);
  const messages = state.getThread(id);

  if (!patientCase) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-3xl">
          🔍
        </div>
        <h1 className="text-xl font-semibold text-text-primary">
          Case not found
        </h1>
        <p className="text-sm text-text-secondary">
          The case you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/patient"
          className="mt-2 text-sm font-medium text-primary hover:text-primary-light transition-colors"
        >
          ← Back to Patient Portal
        </Link>
      </div>
    );
  }

  const isEscalated = patientCase.status === CaseStatus.ESC_SYNCHRONOUS;
  const isResolved = patientCase.status === CaseStatus.RESOLVED;
  const structuredData = patientCase.structuredData as Record<string, any>;
  const treatmentPlan = isResolved ? getTreatmentPlan(id) : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Escalation Banner ─────────────────────────────────── */}
      {isEscalated && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 flex items-center gap-3 animate-slide-down">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/20">
            <svg className="h-5 w-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-danger">
              This case has been escalated to synchronous care
            </p>
            <p className="text-xs text-danger/70 mt-0.5">
              {patientCase.escalationReason}
            </p>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {patientCase.patientName}
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">
            Case #{id.slice(0, 8)}
          </p>
        </div>
        <StatusPill status={patientCase.status} />
      </div>

      {/* ── Case Summary ──────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Case Summary
          </h2>
          <span className="text-xs text-text-muted font-mono">
            {new Date(patientCase.createdAt).toLocaleString("en-CA", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs text-text-muted">Service Type</span>
            <p className="text-sm font-medium text-text-primary mt-0.5">
              {formatServiceType(patientCase.serviceType)}
            </p>
          </div>
          <div>
            <span className="text-xs text-text-muted">Condition / Medication</span>
            <p className="text-sm font-medium text-text-primary mt-0.5">
              {patientCase.conditionKey}
            </p>
          </div>

          {/* Structured data fields */}
          {structuredData.currentDosage && (
            <div>
              <span className="text-xs text-text-muted">Current Dosage</span>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {String(structuredData.currentDosage)}
              </p>
            </div>
          )}
          {structuredData.frequency && (
            <div>
              <span className="text-xs text-text-muted">Frequency</span>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {String(structuredData.frequency)}
              </p>
            </div>
          )}
          {structuredData.labType && (
            <div>
              <span className="text-xs text-text-muted">Lab Type</span>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {String(structuredData.labType)}
              </p>
            </div>
          )}
          {structuredData.testDate && (
            <div>
              <span className="text-xs text-text-muted">Test Date</span>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {String(structuredData.testDate)}
              </p>
            </div>
          )}
          {structuredData.requestingDosageChange && (
            <div className="sm:col-span-2">
              <span className="text-xs text-text-muted">Requested New Dosage</span>
              <p className="text-sm font-medium text-warning mt-0.5">
                {String(structuredData.newDosage ?? "Not specified")}
              </p>
            </div>
          )}
        </div>

        {/* Safety Flags */}
        {patientCase.safetyFlags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs text-text-muted block mb-2">Safety Flags</span>
            <div className="flex flex-wrap gap-2">
              {patientCase.safetyFlags.map((flag) => (
                <SafetyFlagBadge key={flag} flag={flag} />
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {patientCase.freeTextSummary && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs text-text-muted block mb-1.5">AI Summary</span>
            <p className="text-sm text-text-secondary leading-relaxed">
              {patientCase.freeTextSummary}
            </p>
          </div>
        )}

        {/* Free Text */}
        {patientCase.freeText && (
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs text-text-muted block mb-1.5">Patient Notes</span>
            <p className="text-sm text-text-secondary leading-relaxed italic">
              &ldquo;{patientCase.freeText}&rdquo;
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── Resolved / Attestation Card (Powered by SQLite) ───────────────────────── */}
      {isResolved && treatmentPlan && (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 sm:p-8 animate-slide-down relative overflow-hidden shadow-[0_0_40px_var(--color-success-glow)]">
          <div className="absolute top-0 right-0 rounded-bl-xl bg-success/20 px-3 py-1.5 flex items-center gap-1.5 opacity-90 border-b border-l border-success/30">
            <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-success">SQLite Storage Active</span>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-success/20 shadow-inner">
                <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-success tracking-tight">
                  Your Treatment Plan is Ready
                </h3>
                <p className="text-sm text-success/80 mt-0.5">
                  Finalized by <strong className="text-success font-semibold">{treatmentPlan.doctor_name}</strong> on {new Date(treatmentPlan.approved_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="rounded-xl bg-surface/60 backdrop-blur-md p-5 sm:p-6 border border-success/20 shadow-lg">
              <h4 className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Official Clinical Plan
              </h4>
              <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap">
                {treatmentPlan.treatment_plan}
              </p>
            </div>
            
            <div className="flex justify-end mt-2">
              <Link
                href={`/patient/treatment-plan/${id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-surface transition-all hover:bg-success/90 hover:scale-105 shadow-[0_0_20px_var(--color-success-glow)]"
              >
                View Full Secure Plan
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Thread Timeline ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Activity
        </h2>
        <Timeline messages={messages} />
      </div>

      {/* ── Back Link ─────────────────────────────────────────── */}
      <div className="pt-4 border-t border-border">
        <Link
          href="/patient"
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Patient Portal
        </Link>
      </div>
    </div>
  );
}
