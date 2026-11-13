"use client";

import { useEffect, useState } from "react";

// Orchestrated moment: user sees the Command Bar type a real command,
// then the system reply appears. Loops after a pause. One motion, not many.
const COMMAND = "invoice Acme Co $500 net-30";
const REPLY = "Created. neda.app/i/01M7UGX5B";

const CHAR_INTERVAL_MS = 55;
const PAUSE_AFTER_TYPE_MS = 700;
const HOLD_RESULT_MS = 3600;
const PAUSE_BEFORE_RESTART_MS = 1200;

type Phase = "typing" | "reveal" | "hold" | "reset";

export function HeroCommand() {
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    if (phase === "typing") {
      if (typed.length < COMMAND.length) {
        const t = setTimeout(
          () => setTyped(COMMAND.slice(0, typed.length + 1)),
          CHAR_INTERVAL_MS,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("reveal"), PAUSE_AFTER_TYPE_MS);
      return () => clearTimeout(t);
    }
    if (phase === "reveal") {
      const t = setTimeout(() => setPhase("hold"), 50);
      return () => clearTimeout(t);
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("reset"), HOLD_RESULT_MS);
      return () => clearTimeout(t);
    }
    if (phase === "reset") {
      const t = setTimeout(() => {
        setTyped("");
        setPhase("typing");
      }, PAUSE_BEFORE_RESTART_MS);
      return () => clearTimeout(t);
    }
  }, [phase, typed]);

  const showReply = phase === "reveal" || phase === "hold";
  const showCursor = phase === "typing";

  return (
    <div className="rounded-md border border-border bg-card font-mono text-[15px] md:text-lg leading-relaxed overflow-hidden shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>command bar — neda ai</span>
        </div>
        <span className="hidden sm:inline">running</span>
      </div>
      <div className="px-5 py-8 md:py-10 min-h-[9rem] md:min-h-[11rem]">
        <div className="flex items-start gap-3">
          <span className="text-primary select-none">&gt;</span>
          <div className="flex-1">
            <span>{typed}</span>
            {showCursor && <span className="cursor-blink text-primary" />}
          </div>
        </div>
        <div
          className={`mt-5 flex items-start gap-3 text-muted-foreground transition-opacity duration-300 ${
            showReply ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!showReply}
        >
          <span className="text-primary select-none">✓</span>
          <div className="flex-1 break-all">{REPLY}</div>
        </div>
      </div>
    </div>
  );
}
