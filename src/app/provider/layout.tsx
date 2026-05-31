'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', href: '/provider' },
  { icon: '📋', label: 'All Cases', href: '/provider', anchor: '#cases' },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.06] bg-surface-glass backdrop-blur-xl fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-lg">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary tracking-tight">
              ZeroWait
            </h1>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
              Provider
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href + (item.anchor ?? '')}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-[0_0_12px_var(--color-primary-glow)]'
                      : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-white/[0.06]" />

        {/* Provider Info */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              DL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                Dr. Lavoie
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
                <span className="text-[11px] text-success font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-surface-glass/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="text-sm font-bold text-text-primary">ZeroWait</span>
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest ml-1">
            Provider
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-[53px] inset-x-0 z-40 border-b border-white/[0.06] bg-surface-glass/95 backdrop-blur-xl animate-slide-down">
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href + (item.anchor ?? '')}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              DL
            </div>
            <span className="text-sm font-semibold text-text-primary">
              Dr. Lavoie
            </span>
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 lg:ml-64 mt-[53px] lg:mt-0">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
