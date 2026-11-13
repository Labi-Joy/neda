"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineButton } from "@/components/shine-button";
import { toast } from "sonner";
import { isValidNearId } from "@/lib/types";

export function AuthGate() {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nearId = value.trim().toLowerCase();
    if (!isValidNearId(nearId)) {
      toast.error("That doesn't look like a valid NEAR account id");
      return;
    }
    start(async () => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nearId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        toast.error("Could not save");
      }
    });
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 md:p-10">
        <div className="text-xs font-mono text-muted-foreground">
          Welcome to NEDA
        </div>
        <h1 className="heading-tight mt-3 text-2xl md:text-3xl leading-tight">
          What&apos;s your NEAR account?
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Your payments settle here. Any named account (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            you.near
          </code>
          ) or implicit account works. Don&apos;t have one? Create one free at{" "}
          <a
            href="https://wallet.near.org"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            wallet.near.org
          </a>
          .
        </p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nearId" className="text-xs font-mono text-muted-foreground">
              NEAR account id
            </Label>
            <Input
              id="nearId"
              autoFocus
              placeholder="you.near"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono"
            />
          </div>
          <ShineButton
            type="submit"
            size="lg"
            disabled={pending}
            className="w-full"
          >
            {pending ? "Saving…" : "Continue to dashboard"}
          </ShineButton>
        </form>
      </div>
    </div>
  );
}
