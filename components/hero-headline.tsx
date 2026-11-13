"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// Hero reveal: each word rises 28px from 14px blur, staggered 90ms, ease-out-cubic.
// Accent underline draws under "not across weeks". One orchestrated moment, loop once.

const LINE_ONE = ["Invoicing", "that", "routes", "payments"];
const LINE_TWO = ["across", "chains,"];
const LINE_THREE_LEAD = [];
const ACCENT = ["not", "across", "weeks."];

export function HeroHeadline() {
  const reduce = useReducedMotion();

  const wordVariants = {
    hidden: { y: 28, opacity: 0, filter: "blur(14px)" },
    show: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  const wordTransition = {
    duration: 0.65,
    ease: [0.215, 0.61, 0.355, 1] as const,
  };

  if (reduce) {
    return (
      <h1 className="heading-tight text-6xl md:text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.95]">
        Invoicing that routes payments across chains,
        <span className="text-primary"> not across weeks.</span>
      </h1>
    );
  }

  return (
    <h1 className="heading-tight text-6xl md:text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.95]">
      <WordRow words={LINE_ONE} variants={wordVariants} transition={wordTransition} baseDelay={0} />
      <br />
      <WordRow words={LINE_TWO} variants={wordVariants} transition={wordTransition} baseDelay={0.09 * LINE_ONE.length} />
      <br />
      <span className="relative inline-block">
        <WordRow
          words={ACCENT}
          variants={wordVariants}
          transition={wordTransition}
          baseDelay={0.09 * (LINE_ONE.length + LINE_TWO.length)}
          colorClass="text-primary"
        />
        <AccentUnderline delay={0.09 * (LINE_ONE.length + LINE_TWO.length) + 0.45} />
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
}: {
  words: string[];
  variants: Variants;
  transition: object;
  baseDelay: number;
  colorClass?: string;
}) {
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-baseline">
          <motion.span
            className={`inline-block ${colorClass ?? ""}`}
            initial="hidden"
            animate="show"
            variants={variants}
            transition={{ ...transition, delay: baseDelay + i * 0.09 }}
          >
            {w}
            {i < words.length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </>
  );
}

function AccentUnderline({ delay }: { delay: number }) {
  return (
    <motion.svg
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      className="absolute left-0 right-0 -bottom-2 md:-bottom-4 w-full h-[0.25em]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  );
}
