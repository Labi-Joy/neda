"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

// CTA that demos a success morph. Not a real submit; links to /app after the
// morph plays (or immediately if reduced motion is on).

export function CtaSuccess({ href, label }: { href: string; label: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const reduce = useReducedMotion();

  function click() {
    if (reduce) return; // let the <a> handle it
    if (state !== "idle") return;
    setState("loading");
    setTimeout(() => setState("success"), 700);
    setTimeout(() => {
      window.location.href = href;
    }, 1400);
  }

  if (reduce) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-base font-medium"
      >
        {label}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={click}
      whileHover={state === "idle" ? { y: -2 } : {}}
      whileTap={state === "idle" ? { scale: 0.96 } : {}}
      animate={
        state === "success"
          ? { width: 56 }
          : state === "loading"
          ? { width: 56 }
          : { width: "auto" }
      }
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground px-6 text-base font-medium shadow-sm"
      aria-label={state === "success" ? `${label} - loading app` : label}
    >
      {/* Shine sweep on idle */}
      {state === "idle" && (
        <motion.span
          className="pointer-events-none absolute inset-0"
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.8, ease: "linear" }}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
          }}
        />
      )}

      {state === "idle" && <span className="whitespace-nowrap">{label}</span>}

      {state === "loading" && (
        <motion.span
          className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
        />
      )}

      {state === "success" && (
        <motion.svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          aria-hidden="true"
        >
          <motion.path
            d="M 5 12 L 10 17 L 19 7"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.svg>
      )}
    </motion.button>
  );
}
