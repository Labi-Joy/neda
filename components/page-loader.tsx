"use client";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 flex items-center justify-center p-10"
    >
      <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
        <Spinner />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function SkeletonBlock({
  className = "",
  rows = 1,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-muted animate-pulse rounded"
          style={{ width: `${88 - i * 10}%`, marginTop: i === 0 ? 0 : 10 }}
        />
      ))}
    </div>
  );
}

export function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin text-primary"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
