import type { ThreadMessage } from "@/state";

export function Timeline({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-center text-sm text-text-muted py-8">
        No updates yet.
      </p>
    );
  }

  const typeStyles: Record<string, { dot: string; border: string; bg: string }> = {
    system: {
      dot: "bg-text-muted",
      border: "border-border",
      bg: "bg-surface-alt",
    },
    alert: {
      dot: "bg-warning",
      border: "border-warning/20",
      bg: "bg-warning/5",
    },
    resolution: {
      dot: "bg-success",
      border: "border-success/20",
      bg: "bg-success/5",
    },
  };

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      {messages.map((msg, i) => {
        const style = typeStyles[msg.type] ?? typeStyles.system;
        return (
          <div
            key={msg.id}
            className="relative flex gap-4 py-3 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Dot */}
            <div className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot} ring-4 ring-surface`} />

            {/* Content */}
            <div className={`flex-1 rounded-lg border ${style.border} ${style.bg} px-4 py-3`}>
              <p className="text-sm text-text-primary leading-relaxed">
                {msg.content}
              </p>
              <time className="mt-1.5 block text-xs text-text-muted font-mono">
                {new Date(msg.timestamp).toLocaleString("en-CA", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
