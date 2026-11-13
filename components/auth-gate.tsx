"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
      <Card className="w-full max-w-md p-8">
        <div className="text-xs font-mono text-muted-foreground mb-3">
          STEP 1 OF 1
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What&apos;s your NEAR account?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payments settle here. Any named account (
          <code className="text-xs bg-muted px-1 rounded">you.near</code>) or
          implicit account works. Don&apos;t have one? Create one free at{" "}
          <a
            href="https://wallet.near.org"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            wallet.near.org
          </a>
          .
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nearId">NEAR account id</Label>
            <Input
              id="nearId"
              autoFocus
              placeholder="you.near"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Continue to dashboard"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
