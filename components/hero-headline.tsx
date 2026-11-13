"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";

const LINE_ONE = ["Invoicing", "that", "routes", "payments"];
const LINE_TWO = ["across", "chains,"];
const ACCENT = ["not", "across", "weeks."];

export function HeroHeadline() {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: { y: 28, opacity: 0, filter: "blur(14px)" },
    show: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  const transition = {
    duration: 0.6,
    ease: [0.215, 0.61, 0.355, 1] as const,
  };

  if (reduce) {
    return (
      <h1 className="heading-tight text-5xl md:text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.02]">
        Invoicing that routes payments across chains,
        <span className="text-primary"> not across weeks.</span>
      </h1>
    );
  }

  return (
    <h1
      ref={ref}
      className="heading-tight text-5xl md:text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.02]"
    >
      <WordRow
        words={LINE_ONE}
        variants={variants}
        transition={transition}
        baseDelay={0}
        inView={inView}
      />
      <br />
      <WordRow
        words={LINE_TWO}
        variants={variants}
        transition={transition}
        baseDelay={0.085 * LINE_ONE.length}
        inView={inView}
      />
      <br />
      <span className="relative inline-block">
        <WordRow
          words={ACCENT}
          variants={variants}
          transition={transition}
          baseDelay={0.085 * (LINE_ONE.length + LINE_TWO.length)}
          colorClass="text-primary"
          inView={inView}
        />
        <AccentUnderline
          delay={0.085 * (LINE_ONE.length + LINE_TWO.length) + 0.4}
          inView={inView}
        />
      </span>
    </h1>
  );
}

function WordRow({
  words,
  variants,
  transition,
  baseDelay,
  colorClass,
  inView,
}: {
  words: string[];
  variants: Variants;
  transition: object;
  baseDelay: number;
  colorClass?: string;
  inView: boolean;
}) {
  return (
    <>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="inline-block overflow-hidden align-baseline"
        >
          <motion.span
            className={`inline-block ${colorClass ?? ""}`}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={variants}
            transition={{ ...transition, delay: baseDelay + i * 0.085 }}
          >
            {w}
            {i < words.length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </>
  );
}

function AccentUnderline({
  delay,
  inView,
}: {
  delay: number;
  inView: boolean;
}) {
  return (
    <motion.svg
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      className="absolute left-0 right-0 -bottom-2 md:-bottom-3 w-full h-[0.22em]"
      initial={{ opacity: 0 }}
      animate={{ opacity: inView ? 1 : 0 }}
      transition={{ delay, duration: 0.1 }}
      aria-hidden="true"
    >
      <motion.path
        d="M 4 8 Q 100 2, 200 7 T 396 6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        className="text-primary"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: inView ? 1 : 0 }}
        transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}
