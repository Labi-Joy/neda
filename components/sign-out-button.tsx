"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth", { method: "DELETE" });
          router.push("/");
          router.refresh();
        })
      }
    >
      Sign out
    </Button>
  );
}
