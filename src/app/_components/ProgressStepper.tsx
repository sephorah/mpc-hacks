"use client";

export function ProgressStepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            {/* Step circle */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300
                  ${isCompleted ? "bg-primary text-surface scale-100" : ""}
                  ${isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary/40 scale-110" : ""}
                  ${!isCompleted && !isCurrent ? "bg-surface-elevated text-text-muted" : ""}
                `}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline transition-colors ${
                  isCurrent ? "text-primary" : isCompleted ? "text-text-secondary" : "text-text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full bg-surface-elevated overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
