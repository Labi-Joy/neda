"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="text-muted-foreground font-mono text-sm">&gt;</div>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="create invoice for Acme Co $500 due Nov 30 · show unpaid · export last month"
          className="flex-1 bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 font-mono text-sm"
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Run"}
        </Button>
      </form>
      {reply && (
        <div className="mt-3 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
          {reply}
        </div>
      )}
    </div>
  );
}
