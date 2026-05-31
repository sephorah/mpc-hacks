"use client";

import { useEffect, useRef, useState } from "react";

export function MetricCounter({
  value,
  label,
  icon,
  accentColor = "text-primary",
}: {
  value: number;
  label: string;
  icon: string;
  accentColor?: string;
}) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-surface-glass p-4 backdrop-blur-xl"
    >
      <span className="text-lg">{icon}</span>
      <span className={`font-mono text-3xl font-bold tabular-nums ${accentColor}`}>
        {displayed}
      </span>
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
