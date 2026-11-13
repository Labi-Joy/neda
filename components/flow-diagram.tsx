"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// Process-draw diagram. SVG with a dim dashed track and a crimson line that
// sweeps left-to-right over 3s. As the line reaches each node, it pops crimson.

const CHAINS = ["Ethereum", "Arbitrum", "Base", "Solana"];
const LINE_DURATION_S = 3;
const NODE_HIT_FRACTIONS = [0.18, 0.34, 0.5, 0.66]; // when the tip crosses each origin node
const INTENTS_HIT = 0.82;
const DEST_HIT = 0.98;

export function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();

  // nodeState[i] : 0=idle, 1=lit
  const [originLit, setOriginLit] = useState<boolean[]>([false, false, false, false]);
  const [intentsLit, setIntentsLit] = useState(false);
  const [destLit, setDestLit] = useState(false);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) {
        setOriginLit([true, true, true, true]);
        setIntentsLit(true);
        setDestLit(true);
      }
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    NODE_HIT_FRACTIONS.forEach((f, i) => {
      timers.push(
        setTimeout(() => {
          setOriginLit((s) => s.map((v, idx) => (idx === i ? true : v)));
        }, f * LINE_DURATION_S * 1000),
      );
    });
    timers.push(setTimeout(() => setIntentsLit(true), INTENTS_HIT * LINE_DURATION_S * 1000));
    timers.push(setTimeout(() => setDestLit(true), DEST_HIT * LINE_DURATION_S * 1000));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-card p-6 md:p-10 overflow-hidden"
    >
      <div className="relative">
        <svg
          viewBox="0 0 800 360"
          className="w-full h-auto"
          aria-labelledby="flow-title"
          role="img"
        >
          <title id="flow-title">
            Cross-chain payment flow from four origin chains through NEAR
            Intents, settling as USDC on NEAR
          </title>

          {/* Dim dashed track */}
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="text-border"
          />

          {/* Crimson line drawing over it */}
          <motion.path
            d={TRACK_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-primary"
            initial={{ pathLength: 0 }}
            animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: reduce ? 0 : LINE_DURATION_S, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Origin chain nodes */}
          {CHAINS.map((label, i) => {
            const y = 40 + i * 80;
            const lit = originLit[i];
            return (
              <ChainNode
                key={label}
                x={100}
                y={y}
                label={label}
                lit={lit}
              />
            );
          })}

          {/* Intents disc (center) */}
          <IntentsDisc cx={400} cy={180} lit={intentsLit} />

          {/* Destination */}
          <DestinationNode cx={700} cy={180} lit={destLit} />
        </svg>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>4 origin chains</span>
        <span>via NEAR Intents · ~2 min</span>
        <span>USDC on NEAR</span>
      </div>
    </div>
  );
}

const TRACK_PATH = [
  "M 100 40",
  "C 240 40, 320 60, 380 160",
  "L 400 180",
  "M 100 120",
  "C 240 120, 320 150, 380 170",
  "L 400 180",
  "M 100 200",
  "C 240 200, 320 180, 380 180",
  "L 400 180",
  "M 100 280",
  "C 240 280, 320 240, 380 190",
  "L 400 180",
  "M 420 180",
  "C 540 180, 600 180, 680 180",
].join(" ");

function ChainNode({
  x,
  y,
  label,
  lit,
}: {
  x: number;
  y: number;
  label: string;
  lit: boolean;
}) {
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r="7"
        className={lit ? "fill-primary" : "fill-border"}
        animate={lit ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      <text
        x={x - 18}
        y={y + 4}
        textAnchor="end"
        className="fill-foreground"
        style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
      >
        {label}
      </text>
    </g>
  );
}

function IntentsDisc({ cx, cy, lit }: { cx: number; cy: number; lit: boolean }) {
  return (
    <g>
      <motion.circle
        cx={cx}
        cy={cy}
        r="34"
        fill="none"
        strokeWidth="2"
        className={lit ? "stroke-primary" : "stroke-border"}
        animate={lit ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className={lit ? "fill-primary" : "fill-muted-foreground"}
        style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
      >
        intents
      </text>
    </g>
  );
}

function DestinationNode({ cx, cy, lit }: { cx: number; cy: number; lit: boolean }) {
  return (
    <g>
      <motion.rect
        x={cx - 60}
        y={cy - 22}
        width="120"
        height="44"
        rx="6"
        fill="none"
        strokeWidth="2"
        className={lit ? "stroke-primary" : "stroke-border"}
        animate={lit ? { opacity: [0.4, 1] } : { opacity: 0.4 }}
        transition={{ duration: 0.3 }}
      />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14 }}
      >
        USDC on NEAR
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className={lit ? "fill-primary" : "fill-muted-foreground"}
        style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
      >
        {lit ? "settled" : "awaiting"}
      </text>
    </g>
  );
}
