import Link from "next/link";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Patient Portal Header ─────────────────────────────── */}
      <div className="border-b border-border bg-surface-glass/50 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Home
            </Link>
            <span className="text-border">|</span>
            <span className="text-sm font-semibold text-text-secondary tracking-tight">
              Zero<span className="text-primary">Wait</span>
              <span className="text-text-muted font-normal"> · Patient Portal</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-text-muted">Online</span>
          </div>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────────── */}
      <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        {children}
      </div>
    </div>
  );
}
