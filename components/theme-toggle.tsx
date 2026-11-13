"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = mounted ? resolvedTheme : "dark";
  const next = current === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded"
    >
      <span aria-hidden="true">{current === "dark" ? "◐" : "◑"}</span>
      <span>{current === "dark" ? "dark" : "light"}</span>
    </button>
  );
}
