"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/near/wallet-provider";

export function SignOutButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { signOut } = useWallet();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          router.push("/");
          router.refresh();
        })
      }
      className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
