"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/app/_components/GlassCard";

export default function EscalatedPage() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(3600); // 60 minutes

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCaseId(params.get("id"));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem-3rem)] flex-col items-center justify-center px-4 animate-fade-in">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        {/* ── Pulsing Danger Icon ──────────────────────────────── */}
        <div className="relative">
          {/* Outer pulsing rings */}
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-danger/30 animate-[ping_2s_ease-out_infinite]" />
          <div className="absolute inset-0 -m-8 rounded-full border border-danger/15 animate-[ping_2.5s_ease-out_infinite_0.5s]" />
          <div className="absolute inset-0 -m-2 rounded-full bg-danger/10 animate-pulse-glow" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-danger/15 border-2 border-danger/30">
            <svg
              className="h-12 w-12 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* ── Message ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-danger tracking-tight">
            You&apos;ve been routed to priority care
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Based on your health screening responses, your case requires
            immediate attention. A care coordinator will contact you shortly.
          </p>
        </div>

        {/* ── Countdown Timer ─────────────────────────────────── */}
        <GlassCard className="w-full border-danger/20">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-danger/70">
              Estimated Contact Time
            </span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-5xl font-bold text-text-primary tabular-nums">
                {String(mins).padStart(2, "0")}
              </span>
              <span className="text-2xl text-danger animate-pulse-glow">:</span>
              <span className="text-5xl font-bold text-text-primary tabular-nums">
                {String(secs).padStart(2, "0")}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              A care coordinator will contact you within 1 hour
            </p>
          </div>
        </GlassCard>

        {/* ── What to do ──────────────────────────────────────── */}
        <GlassCard className="w-full text-left">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            While you wait:
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-danger mt-0.5">•</span>
              If you experience a medical emergency, call <strong className="text-text-primary">911</strong> immediately
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-0.5">•</span>
              Keep your phone nearby — we may reach you by call or text
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Do not take any new medications until you speak with a provider
            </li>
          </ul>
        </GlassCard>

        {/* ── Thread Link ─────────────────────────────────────── */}
        {caseId && (
          <Link
            href={`/patient/thread/${caseId}`}
            className="group flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-light"
          >
            View your case status
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
