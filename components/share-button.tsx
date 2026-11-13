"use client";

import { useState } from "react";
import { toast } from "sonner";

// On mobile (iOS Safari, Android Chrome, mobile Edge), navigator.share opens
// the OS share sheet with every installed app: WhatsApp, Mail, X, Telegram,
// Messages, Signal, etc. On desktop (where share support is uneven), we
// fall back to writing to the clipboard.

export function ShareButton({
  url,
  title = "Invoice",
  text,
  className,
}: {
  url: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  async function share() {
    if (canShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled the OS share sheet - no toast needed.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        className ??
        "inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-transform hover:-translate-y-0.5 active:scale-95"
      }
    >
      <ShareIcon />
      <span>
        {copied ? "Link copied" : canShare ? "Share invoice" : "Copy link"}
      </span>
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
