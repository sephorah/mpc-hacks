import type { CaseStatus } from "@/state";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; glow: string }
> = {
  INTAKE_PENDING: {
    label: "Pending",
    color: "text-text-secondary",
    bg: "bg-surface-elevated",
    glow: "",
  },
  COHORT_READY: {
    label: "In Cohort",
    color: "text-primary",
    bg: "bg-primary/10",
    glow: "shadow-[0_0_8px_var(--color-primary-glow)]",
  },
  OUTLIER_ISOLATED: {
    label: "Outlier",
    color: "text-warning",
    bg: "bg-warning/10",
    glow: "shadow-[0_0_8px_var(--color-warning-glow)]",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-success",
    bg: "bg-success/10",
    glow: "shadow-[0_0_8px_var(--color-success-glow)]",
  },
  ESC_SYNCHRONOUS: {
    label: "Escalated",
    color: "text-danger",
    bg: "bg-danger/10",
    glow: "shadow-[0_0_8px_var(--color-danger-glow)]",
  },
};

export function StatusPill({ status }: { status: CaseStatus | string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.INTAKE_PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color} ${config.bg} ${config.glow}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
      {config.label}
    </span>
  );
}
