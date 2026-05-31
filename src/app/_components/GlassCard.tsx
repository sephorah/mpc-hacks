export function GlassCard({
  children,
  className = "",
  hover = false,
  padding = "p-6",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}) {
  return (
    <div
      className={`
        rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl
        ${padding}
        ${hover ? "transition-all duration-200 hover:border-white/[0.12] hover:bg-surface-alt hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
