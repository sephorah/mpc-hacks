'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/app/_components/GlassCard';
import { MetricCounter } from '@/app/_components/MetricCounter';
import { SafetyFlagBadge } from '@/app/_components/SafetyFlagBadge';

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

interface CohortGroup {
  id: string;
  serviceType: string;
  conditionKey: string;
  caseIds: string[];
  createdAt: number;
}

interface Stats {
  totalPending: number;
  activeCohorts: number;
  outlierCases: number;
  escalatedCases: number;
  resolvedToday: number;
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

function serviceIcon(type: string): string {
  switch (type) {
    case 'RENEWAL':
      return '💊';
    case 'LAB_FOLLOW_UP':
      return '🔬';
    case 'CHRONIC_CHECK_IN':
      return '🩺';
    default:
      return '📄';
  }
}

function serviceLabel(type: string): string {
  switch (type) {
    case 'RENEWAL':
      return 'Renewal';
    case 'LAB_FOLLOW_UP':
      return 'Lab Follow-up';
    case 'CHRONIC_CHECK_IN':
      return 'Check-in';
    default:
      return type;
  }
}

/* ─── Skeleton Components ───────────────────────────────────────────────────── */

function MetricSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-glass p-4 backdrop-blur-xl">
      <div className="h-5 w-5 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
      <div className="h-8 w-16 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
      <div className="h-3 w-20 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
          <div className="h-3 w-20 rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-white/[0.06] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%' }} />
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────────── */

export default function ProviderDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cohorts, setCohorts] = useState<CohortGroup[] | null>(null);
  const [outliers, setOutliers] = useState<PatientCase[] | null>(null);
  const [escalated, setEscalated] = useState<PatientCase[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [cohortsRes, outliersRes, escalatedRes] = await Promise.all([
        fetch('/api/cohorts'),
        fetch('/api/cases?status=OUTLIER_ISOLATED'),
        fetch('/api/cases?status=ESC_SYNCHRONOUS'),
      ]);

      const cohortsData = await cohortsRes.json();
      const outliersData = await outliersRes.json();
      const escalatedData = await escalatedRes.json();

      setStats(cohortsData.stats);
      setCohorts(
        cohortsData.cohorts.filter(
          (c: CohortGroup) => c.caseIds.length > 0,
        ),
      );
      setOutliers(outliersData.cases);
      setEscalated(escalatedData.cases);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const loading = !stats || !cohorts || !outliers || !escalated;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-slide-down">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Provider Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Asynchronous care queue overview
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`
            flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-text-secondary
            border border-white/[0.06] transition-all duration-200
            hover:bg-white/[0.1] hover:text-text-primary hover:border-white/[0.12]
            active:scale-95 disabled:opacity-50
          `}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Metrics Row ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCounter
              icon="📥"
              value={stats.totalPending}
              label="Total Pending"
              accentColor="text-primary"
            />
            <MetricCounter
              icon="📦"
              value={stats.activeCohorts}
              label="Active Cohorts"
              accentColor="text-accent"
            />
            <MetricCounter
              icon="⚠️"
              value={stats.outlierCases}
              label="Outlier Cases"
              accentColor="text-warning"
            />
            <MetricCounter
              icon="✅"
              value={stats.resolvedToday}
              label="Resolved Today"
              accentColor="text-success"
            />
          </>
        )}
      </div>

      {/* ── Two Column Layout ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6" id="cases">
        {/* Left — Cohort Queue (3/5) */}
        <div className="xl:col-span-3 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-text-primary">
                Cohort Queue
              </h2>
              {cohorts && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary tabular-nums">
                  {cohorts.length} {cohorts.length === 1 ? 'cohort' : 'cohorts'}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : cohorts.length === 0 ? (
            <GlassCard className="text-center py-12">
              <span className="text-4xl block mb-3">🎉</span>
              <p className="text-text-secondary text-sm">
                No active cohorts — all caught up!
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {cohorts.map((cohort, i) => (
                <Link
                  key={cohort.id}
                  href={`/provider/cohort/${encodeURIComponent(cohort.id)}`}
                  className="block group"
                >
                  <GlassCard
                    hover
                    className="animate-slide-up"
                    padding="p-0"
                  >
                    <div
                      className="p-5"
                      style={{ animationDelay: `${0.05 * i}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {/* Service Icon */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                            {serviceIcon(cohort.serviceType)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                              {cohort.conditionKey}
                            </h3>
                            <p className="text-xs text-text-muted mt-0.5">
                              {serviceLabel(cohort.serviceType)} · {relativeTime(cohort.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary tabular-nums">
                            {cohort.caseIds.length}{' '}
                            {cohort.caseIds.length === 1 ? 'case' : 'cases'}
                          </span>
                          <span className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all text-sm">
                            Review Batch →
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right — Individual Cases (2/5) */}
        <div className="xl:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-text-primary">
            Requires Individual Review
          </h2>

          {/* Outlier Cases */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-warning">⚠️ Outlier Cases</span>
              {outliers && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning tabular-nums">
                  {outliers.length}
                </span>
              )}
            </div>

            {loading ? (
              <CardSkeleton />
            ) : outliers.length === 0 ? (
              <GlassCard padding="p-4">
                <p className="text-xs text-text-muted text-center">
                  No outlier cases
                </p>
              </GlassCard>
            ) : (
              outliers.map((c) => (
                <Link
                  key={c.id}
                  href={`/provider/case/${c.id}`}
                  className="block group"
                >
                  <GlassCard
                    hover
                    className="border-warning/20 hover:border-warning/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary group-hover:text-warning transition-colors">
                            {c.patientName}
                          </h4>
                          <p className="text-xs text-text-muted">
                            {c.conditionKey} · {serviceLabel(c.serviceType)}
                          </p>
                        </div>
                        {c.safetyFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {c.safetyFlags.map((flag) => (
                              <SafetyFlagBadge key={flag} flag={flag} />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-text-muted group-hover:text-warning group-hover:translate-x-0.5 transition-all text-xs shrink-0 mt-1">
                        Review →
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))
            )}
          </div>

          {/* Escalated Cases */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-danger">🚨 Escalated Cases</span>
              {escalated && (
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger tabular-nums">
                  {escalated.length}
                </span>
              )}
            </div>

            {loading ? (
              <CardSkeleton />
            ) : escalated.length === 0 ? (
              <GlassCard padding="p-4">
                <p className="text-xs text-text-muted text-center">
                  No escalated cases
                </p>
              </GlassCard>
            ) : (
              escalated.map((c) => (
                <Link
                  key={c.id}
                  href={`/provider/case/${c.id}`}
                  className="block group"
                >
                  <GlassCard
                    hover
                    className="border-danger/20 hover:border-danger/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary group-hover:text-danger transition-colors">
                            {c.patientName}
                          </h4>
                          <p className="text-xs text-text-muted">
                            {c.conditionKey} · {serviceLabel(c.serviceType)}
                          </p>
                        </div>
                        {c.escalationReason && (
                          <p className="text-xs text-danger/80 bg-danger/5 rounded-lg px-2.5 py-1.5 border border-danger/10">
                            {c.escalationReason}
                          </p>
                        )}
                        {c.safetyFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {c.safetyFlags.map((flag) => (
                              <SafetyFlagBadge key={flag} flag={flag} />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-text-muted group-hover:text-danger group-hover:translate-x-0.5 transition-all text-xs shrink-0 mt-1">
                        Review →
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
