import { RED_FLAG_LABELS } from "@/domain";

export function SafetyFlagBadge({ flag }: { flag: string }) {
  const isRedFlag = flag in RED_FLAG_LABELS || flag.startsWith("high");
  const isOutlier = flag.startsWith("dosage") || flag.startsWith("deviation:");

  const label = RED_FLAG_LABELS[flag] ?? flag.replace(/^deviation:/, "Field deviation: ");

  if (isRedFlag) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        {label}
      </span>
    );
  }

  if (isOutlier) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
        </svg>
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-elevated px-2 py-0.5 text-xs font-medium text-text-secondary">
      {label}
    </span>
  );
}
