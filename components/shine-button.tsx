"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShineSize = "sm" | "md" | "lg";

const sizeClasses: Record<ShineSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-12 px-6 text-base",
};

type BaseProps = {
  size?: ShineSize;
  variant?: "solid" | "ghost";
  shine?: boolean;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ButtonProps = BaseProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type Props = LinkProps | ButtonProps;

export function ShineButton(props: Props) {
  const {
    size = "md",
    variant = "solid",
    shine = true,
    className,
    children,
  } = props;

  const base = cn(
    "relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-transform select-none",
    variant === "solid"
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-transparent text-foreground border border-border",
    sizeClasses[size],
    className,
  );

  const content = (
    <>
      {shine && variant === "solid" && (
        <motion.span
          className="pointer-events-none absolute inset-0"
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 2.8,
            ease: "linear",
          }}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      )}
      <span className="relative whitespace-nowrap">{children}</span>
    </>
  );

  if ("href" in props && props.href) {
    const external = /^https?:\/\//.test(props.href);
    if (external) {
      return (
        <motion.a
          href={props.href}
          target={props.target}
          rel={props.rel}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={base}
        >
          {content}
        </motion.a>
      );
    }
    return (
      <motion.span
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        <Link href={props.href} className={base}>
          {content}
        </Link>
      </motion.span>
    );
  }

  const btn = props as ButtonProps;
  return (
    <motion.button
      type={btn.type ?? "button"}
      onClick={btn.onClick}
      disabled={btn.disabled}
      whileHover={!btn.disabled ? { y: -2 } : {}}
      whileTap={!btn.disabled ? { scale: 0.96 } : {}}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(base, btn.disabled && "opacity-50 cursor-not-allowed")}
    >
      {content}
    </motion.button>
  );
}
