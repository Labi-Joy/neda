"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const CHAINS = ["Ethereum", "Arbitrum", "Base", "Solana"];

const CHAIN_HIT = [0, 160, 320, 480];
const INTENTS_HIT = 820;
const DEST_HIT = 1150;

export function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  const [originLit, setOriginLit] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [intentsLit, setIntentsLit] = useState(false);
  const [destLit, setDestLit] = useState(false);

  useEffect(() => {
    if (reduce) {
      setOriginLit([true, true, true, true]);
      setIntentsLit(true);
      setDestLit(true);
      return;
    }
    if (!inView) {
      setOriginLit([false, false, false, false]);
      setIntentsLit(false);
      setDestLit(false);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    CHAIN_HIT.forEach((ms, i) => {
      timers.push(
        setTimeout(() => {
          setOriginLit((s) => s.map((v, idx) => (idx === i ? true : v)));
        }, ms),
      );
    });
    timers.push(setTimeout(() => setIntentsLit(true), INTENTS_HIT));
    timers.push(setTimeout(() => setDestLit(true), DEST_HIT));

    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-card p-5 md:p-10"
    >
      {/* Desktop: 3-column fan-in */}
      <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-12 items-center text-sm">
        <SourcesColumn originLit={originLit} />
        <IntentsNode intentsLit={intentsLit} />
        <DestColumn destLit={destLit} />
      </div>

      {/* Mobile: vertical stack with downward connectors */}
      <div className="md:hidden space-y-5 text-sm">
        <SourcesColumn originLit={originLit} />
        <VerticalConnector lit={intentsLit} />
        <IntentsNodeInline lit={intentsLit} />
        <VerticalConnector lit={destLit} />
        <DestColumn destLit={destLit} compact />
      </div>
    </div>
  );
}

function SourcesColumn({ originLit }: { originLit: boolean[] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">
        Client pays from
      </div>
      <ul className="space-y-2">
        {CHAINS.map((label, i) => (
          <motion.li
            key={label}
            animate={{
              borderColor: originLit[i] ? "var(--primary)" : "var(--border)",
              color: originLit[i] ? "var(--primary)" : "var(--foreground)",
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between border rounded px-3 py-2.5"
          >
            <span>{label}</span>
            <motion.span
              animate={{ scale: originLit[i] ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-mono text-muted-foreground"
            >
              USDC
            </motion.span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function IntentsNode({ intentsLit }: { intentsLit: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        via
      </div>
      <motion.div
        animate={{
          borderColor: intentsLit ? "var(--primary)" : "var(--border)",
          backgroundColor: intentsLit
            ? "color-mix(in oklch, var(--primary) 10%, transparent)"
            : "color-mix(in oklch, var(--primary) 2%, transparent)",
          scale: intentsLit ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-16 w-16 rounded-full border flex items-center justify-center"
      >
        <motion.span
          animate={{
            color: intentsLit ? "var(--primary)" : "var(--muted-foreground)",
          }}
          className="font-mono text-xs tracking-tight"
        >
          intents
        </motion.span>
      </motion.div>
      <div className="font-mono text-[11px] text-muted-foreground">~2 min</div>
    </div>
  );
}

function IntentsNodeInline({ lit }: { lit: boolean }) {
  return (
    <motion.div
      animate={{
        borderColor: lit ? "var(--primary)" : "var(--border)",
        backgroundColor: lit
          ? "color-mix(in oklch, var(--primary) 10%, transparent)"
          : "color-mix(in oklch, var(--primary) 2%, transparent)",
      }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex items-center gap-3 border rounded-full px-4 py-2"
    >
      <motion.span
        animate={{
          color: lit ? "var(--primary)" : "var(--muted-foreground)",
        }}
        className="font-mono text-xs"
      >
        NEAR Intents
      </motion.span>
      <span className="font-mono text-[11px] text-muted-foreground">
        ~2 min
      </span>
    </motion.div>
  );
}

function DestColumn({
  destLit,
  compact,
}: {
  destLit: boolean;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-muted-foreground">
        Freelancer receives
      </div>
      <motion.div
        animate={{
          borderColor: destLit ? "var(--primary)" : "var(--border)",
          backgroundColor: destLit
            ? "color-mix(in oklch, var(--primary) 8%, transparent)"
            : "color-mix(in oklch, var(--primary) 2%, transparent)",
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="border rounded px-3 py-2.5 flex items-center justify-between"
      >
        <span className="font-medium">USDC on NEAR</span>
        <motion.span
          animate={{
            color: destLit ? "var(--primary)" : "var(--muted-foreground)",
            opacity: destLit ? 1 : 0.6,
          }}
          className="text-xs font-mono"
        >
          {destLit ? "settled" : "awaiting"}
        </motion.span>
      </motion.div>
      {!compact && (
        <div className="text-xs text-muted-foreground mt-4 leading-relaxed">
          Zero gas purchased. Zero bridge UI. The freelancer&apos;s wallet
          balance just goes up.
        </div>
      )}
    </div>
  );
}

function VerticalConnector({ lit }: { lit: boolean }) {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <motion.div
        animate={{
          backgroundColor: lit ? "var(--primary)" : "var(--border)",
          opacity: lit ? 1 : 0.5,
        }}
        transition={{ duration: 0.3 }}
        className="w-px h-6"
      />
    </div>
  );
}
