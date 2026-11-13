"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWallet } from "@/components/near/wallet-provider";
import { ShineButton } from "@/components/shine-button";

export function AuthGate() {
  const { selector, accountId, openModal } = useWallet();
  const router = useRouter();

  // When wallet-selector reports a connected account, the provider has
  // already created the server session. Refresh the route tree so the
  // layout re-runs and the dashboard shows.
  useEffect(() => {
    if (accountId) router.refresh();
  }, [accountId, router]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 md:p-10">
        <div className="text-xs font-mono text-muted-foreground">
          Welcome to NEDA
        </div>
        <h1 className="heading-tight mt-3 text-2xl md:text-3xl leading-tight">
          Connect your NEAR wallet.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Your payments settle to the connected account as USDC on NEAR. No
          transactions, no fees to sign in.
        </p>

        <div className="mt-7">
          <ShineButton
            onClick={openModal}
            size="lg"
            disabled={!selector}
            className="w-full"
          >
            {selector
              ? accountId
                ? "Entering…"
                : "Connect wallet"
              : "Loading…"}
          </ShineButton>
          <p className="mt-4 text-xs font-mono text-muted-foreground leading-relaxed">
            HERE Wallet (mobile) · Meteor (desktop + mobile) · MyNearWallet
            (desktop). New to NEAR?{" "}
            <a
              href="https://wallet.near.org"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Create one in 30 seconds.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
