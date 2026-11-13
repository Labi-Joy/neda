"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  variant = "ghost",
}: {
  value: string;
  label?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={copy}>
      {copied ? "Copied ✓" : label}
    </Button>
  );
}
