"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const EXAMPLES = [
  "create invoice for Acme Co $500 due Nov 30",
  "show unpaid invoices",
  "export last month as csv",
];

export function CommandBar({ nearId }: { nearId: string }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [reply, setReply] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = value.trim();
    if (!message) return;

    start(async () => {
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, nearId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Command failed");
          return;
        }
        setReply(data.reply ?? "Done.");
        setValue("");
        if (data.refresh) router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>command bar — neda ai</span>
        </div>
        <span className="hidden sm:inline">type or paste a command</span>
      </div>
      <form
        onSubmit={submit}
        className="flex items-center gap-3 px-5 py-4 font-mono text-[15px] md:text-base"
      >
        <span className="text-primary select-none">&gt;</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="create invoice for Acme Co $500 due Nov 30"
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
          disabled={pending}
          aria-label="Command bar input"
        />
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="text-xs font-mono px-3 py-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "…" : "run ↵"}
        </button>
      </form>
      {reply && (
        <div className="px-5 pb-4 flex items-start gap-3 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
          <span className="text-primary select-none">✓</span>
          <span className="flex-1">{reply}</span>
        </div>
      )}
      {!reply && !pending && !value && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setValue(e)}
              className="text-xs font-mono px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
