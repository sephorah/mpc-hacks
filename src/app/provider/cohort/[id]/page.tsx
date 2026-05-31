'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/app/_components/GlassCard';
import { StatusPill } from '@/app/_components/StatusPill';
import { SafetyFlagBadge } from '@/app/_components/SafetyFlagBadge';
import { ProgressStepper } from '@/app/_components/ProgressStepper';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface PatientCase {
  id: string;
  patientName: string;
  serviceType: string;
  conditionKey: string;
  structuredData: Record<string, unknown>;
  freeText: string;
  freeTextSummary: string;
  safetyFlags: string[];
  status: string;
  cohortId: string | null;
  createdAt: number;
  resolvedAt: number | null;
  attestedBy: string | null;
  attestedAt: number | null;
  attestationNotes: string;
  escalationReason: string;
}

interface CohortData {
  id: string;
  serviceType: string;
  conditionKey: string;
  caseIds: string[];
  createdAt: number;
  cases: PatientCase[];
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function serviceLabel(type: string): string {
  switch (type) {
    case 'RENEWAL': return 'Renewal';
    case 'LAB_FOLLOW_UP': return 'Lab Follow-up';
    case 'CHRONIC_CHECK_IN': return 'Check-in';
    default: return type;
  }
}

function serviceIcon(type: string): string {
  switch (type) {
    case 'RENEWAL': return '💊';
    case 'LAB_FOLLOW_UP': return '🔬';
    case 'CHRONIC_CHECK_IN': return '🩺';
    default: return '📄';
  }
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */

function CaseSkeleton() {
  const shimmerStyle = {
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
    backgroundSize: '200% 100%',
  };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-glass p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-4 w-32 rounded bg-white/[0.06] animate-shimmer" style={shimmerStyle} />
        <div className="h-3 w-16 rounded bg-white/[0.06] animate-shimmer" style={shimmerStyle} />
      </div>
      <div className="h-3 w-full rounded bg-white/[0.06] animate-shimmer" style={shimmerStyle} />
      <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-shimmer" style={shimmerStyle} />
      <div className="h-12 w-full rounded bg-white/[0.06] animate-shimmer" style={shimmerStyle} />
    </div>
  );
}

/* ─── Attestation Modal ─────────────────────────────────────────────────────── */

function AttestationModal({
  cases,
  onComplete,
  onClose,
}: {
  cases: PatientCase[];
  onComplete: () => void;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [isAttesting, setIsAttesting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');

  const currentCase = cases[currentIdx];
  const progress = currentIdx / cases.length;

  const handleAttest = async () => {
    if (!currentCase) return;
    setIsAttesting(true);

    try {
      await fetch(`/api/cases/${currentCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'attest',
          doctorId: 'Dr. Lavoie',
          notes: notes || 'Approved — standard case.',
        }),
      });

      if (currentIdx + 1 >= cases.length) {
        setCompleted(true);
        setTimeout(onComplete, 2000);
      } else {
        setSlideDir('out');
        setTimeout(() => {
          setCurrentIdx((i) => i + 1);
          setNotes('');
          setSlideDir('in');
        }, 300);
      }
    } catch (err) {
      console.error('Attestation failed:', err);
    } finally {
      setIsAttesting(false);
    }
  };

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="rounded-3xl border border-success/20 bg-surface p-12 text-center space-y-6 animate-scale-in max-w-md mx-4 shadow-2xl shadow-success/10">
          {/* Success circle */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/10 shadow-[0_0_40px_var(--color-success-glow)]">
            <svg className="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-[draw_0.6s_ease-out_forwards]" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'draw 0.6s ease-out 0.3s forwards' }} />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-success">All Cases Attested!</h3>
            <p className="text-sm text-text-muted mt-2">
              {cases.length} cases resolved successfully
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {['🎉', '✨', '🎊'].map((emoji, i) => (
              <span
                key={i}
                className="text-2xl animate-float"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.08] bg-surface shadow-2xl animate-scale-in">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Sequential Attestation
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-text-muted hover:bg-white/[0.1] hover:text-text-primary transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                Attesting case{' '}
                <span className="text-primary font-bold">{currentIdx + 1}</span>{' '}
                of <span className="font-bold">{cases.length}</span>
              </span>
              <span className="text-primary font-mono font-bold">
                {Math.round(((currentIdx) / cases.length) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out shadow-[0_0_8px_var(--color-primary-glow)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body — Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            key={currentIdx}
            className={`space-y-4 transition-all duration-300 ${
              slideDir === 'in'
                ? 'animate-slide-up'
                : 'opacity-0 -translate-y-4'
            }`}
          >
            {/* Patient Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {currentCase.patientName}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {currentCase.conditionKey} · {relativeTime(currentCase.createdAt)}
                </p>
              </div>
              <StatusPill status={currentCase.status} />
            </div>

            {/* Structured Data */}
            <GlassCard padding="p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Structured Data
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(currentCase.structuredData).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-xs text-text-muted">{formatFieldName(key)}</span>
                    <span className="text-xs text-text-primary font-medium text-right">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* AI Summary */}
            {currentCase.freeTextSummary && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-semibold text-accent mb-1.5">🤖 AI Summary</p>
                <p className="text-sm text-text-secondary leading-relaxed italic">
                  {currentCase.freeTextSummary.endsWith('...') ? (
                    <>&ldquo;{currentCase.freeText}&rdquo;</>
                  ) : (
                    <>&ldquo;{currentCase.freeTextSummary}&rdquo;</>
                  )}
                </p>
              </div>
            )}

            {/* Safety Flags */}
            {currentCase.safetyFlags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentCase.safetyFlags.map((f) => (
                  <SafetyFlagBadge key={f} flag={f} />
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Attestation Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this case…"
                rows={2}
                className="w-full rounded-xl border border-white/[0.08] bg-surface-glass px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAttest}
            disabled={isAttesting}
            className={`
              flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200
              bg-success text-surface hover:bg-success/90 active:scale-95
              shadow-[0_0_20px_var(--color-success-glow)]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isAttesting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Attesting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Attest Case
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Cohort Page ───────────────────────────────────────────────────────────── */

export default function CohortReviewPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const cohortId = decodeURIComponent(rawId);

  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});
  const [treatmentPlans, setTreatmentPlans] = useState<Record<string, string>>({});

  const toggleSummary = (id: string) => {
    setExpandedSummaries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTreatmentPlanChange = (id: string, text: string) => {
    setTreatmentPlans(prev => ({ ...prev, [id]: text }));
  };

  const handleApproveCase = async (caseId: string) => {
    setApprovingIds(prev => ({ ...prev, [caseId]: true }));
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'attest',
          doctorId: 'Dr. Lavoie',
          notes: treatmentPlans[caseId] || 'Approved — standard case.',
        }),
      });
      fetchCohort();
    } catch (err) {
      console.error('Attestation failed:', err);
    } finally {
      setApprovingIds(prev => ({ ...prev, [caseId]: false }));
    }
  };

  const fetchCohort = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cohorts/${encodeURIComponent(cohortId)}`);
      if (!res.ok) throw new Error('Cohort not found');
      const data = await res.json();
      setCohort(data.cohort);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    fetchCohort();
  }, [fetchCohort]);

  const handleComplete = () => {
    router.push('/provider');
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <GlassCard className="max-w-md mx-auto py-12">
          <span className="text-4xl block mb-3">😞</span>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Cohort Not Found
          </h2>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <Link
            href="/provider"
            className="text-sm text-primary hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="animate-slide-down">
        <Link
          href="/provider"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-64 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
            <div className="h-4 w-32 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
          </div>
        ) : cohort && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{serviceIcon(cohort.serviceType)}</span>
              <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
                {cohort.conditionKey}{' '}
                <span className="text-text-secondary font-normal">
                  {serviceLabel(cohort.serviceType)}
                </span>
              </h1>
            </div>
            <StatusPill status="COHORT_READY" />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {cohort.cases.length} {cohort.cases.length === 1 ? 'case' : 'cases'}
            </span>
          </div>
        )}
      </div>

      {/* ── Case List ───────────────────────────── */}
      <div className="space-y-4">
        {loading ? (
          <>
            <CaseSkeleton />
            <CaseSkeleton />
            <CaseSkeleton />
          </>
        ) : (
          cohort?.cases.map((c, i) => (
            <GlassCard
              key={c.id}
              className="animate-slide-up"
              padding="p-0"
            >
              <div className="p-5 lg:p-6 space-y-4" style={{ animationDelay: `${0.05 * i}s` }}>
                {/* Patient Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {c.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {c.patientName}
                      </h3>
                      <p className="text-xs text-text-muted">
                        Submitted {relativeTime(c.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>

                {/* Structured Data */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 rounded-xl bg-surface-elevated/50 px-4 py-3">
                  {Object.entries(c.structuredData).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">
                        {formatFieldName(key)}
                      </span>
                      <p className="text-xs text-text-primary font-medium">
                        {String(val)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Summary */}
                {c.freeTextSummary && (
                  <div 
                    className="border-l-2 border-accent/30 pl-4 py-1 cursor-pointer group"
                    onClick={() => toggleSummary(c.id)}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs text-accent/80 font-medium group-hover:text-accent transition-colors">
                        🤖 AI Summary
                      </p>
                      <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {expandedSummaries[c.id] ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                    <div className={`text-sm text-text-secondary italic leading-relaxed ${expandedSummaries[c.id] ? '' : 'line-clamp-1'}`}>
                      {expandedSummaries[c.id] && c.freeTextSummary.endsWith('...') ? (
                        <>&ldquo;{c.freeText}&rdquo;</>
                      ) : (
                        <>&ldquo;{c.freeTextSummary}&rdquo;</>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment Plan Textbox */}
                <div className="mt-4 border-l-2 border-transparent pl-4">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                    Treatment Plan
                  </label>
                  <textarea
                    value={treatmentPlans[c.id] || ''}
                    onChange={(e) => handleTreatmentPlanChange(c.id, e.target.value)}
                    placeholder="Enter treatment plan or clinical notes..."
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-glass px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none resize-y transition-all"
                  />
                </div>

                {/* Safety Flags + Actions */}
                <div className="flex items-center justify-between gap-4 flex-wrap mt-2 pt-2 border-t border-white/[0.04]">
                  <div className="flex flex-wrap gap-1.5">
                    {c.safetyFlags.map((f) => (
                      <SafetyFlagBadge key={f} flag={f} />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={() => handleApproveCase(c.id)}
                      disabled={approvingIds[c.id]}
                      className={`
                        flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200
                        bg-success/20 text-success hover:bg-success hover:text-surface
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {approvingIds[c.id] ? (
                        <>
                          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Approving...
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Case
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Removed Sticky Bottom Bar and Modal as per individual attestation design */}
    </div>
  );
}
