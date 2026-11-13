"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/components/near/wallet-provider";
import { ShineButton } from "@/components/shine-button";
import { toast } from "sonner";
import { SIGN_MESSAGE_RECIPIENT } from "@/lib/near-config";

export function AuthGate() {
  const { selector, accountId, openModal } = useWallet();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const attempted = useRef(false);

  // When a wallet connects, kick off the sign-in-message flow automatically.
  useEffect(() => {
    if (!selector || !accountId || attempted.current || verifying) return;
    attempted.current = true;

    (async () => {
      setVerifying(true);
      try {
        const nonceResp = await fetch("/api/auth/nonce");
        if (!nonceResp.ok) throw new Error("could not get nonce");
        const { nonce, recipient, message } = await nonceResp.json();

        const wallet = await selector.wallet();
        if (!wallet.signMessage) {
          toast.error(
            "This wallet does not support sign-in messages. Try Meteor or MyNearWallet.",
          );
          setVerifying(false);
          return;
        }

        const signed = await wallet.signMessage({
          message,
          nonce: Buffer.from(nonce, "base64"),
          recipient,
        });

        if (!signed) {
          setVerifying(false);
          return;
        }

        const verifyResp = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: signed.accountId,
            publicKey: signed.publicKey,
            signature: signed.signature,
            message,
            nonce,
            recipient,
          }),
        });

        if (!verifyResp.ok) {
          const err = await verifyResp.json().catch(() => ({}));
          toast.error(err.error ?? "Signature verification failed");
          setVerifying(false);
          return;
        }

        toast.success("Signed in");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Sign-in failed");
        attempted.current = false;
        setVerifying(false);
      }
    })();
  }, [selector, accountId, verifying, router]);

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
          Your payments settle to the connected account as USDC on NEAR.
          You will be asked to sign a one-time message. No transactions,
          no fees.
        </p>

        <div className="mt-7">
          <ShineButton
            onClick={openModal}
            size="lg"
            disabled={verifying || !selector}
            className="w-full"
          >
            {verifying
              ? "Verifying signature…"
              : selector
                ? "Connect wallet"
                : "Loading…"}
          </ShineButton>
          <p className="mt-4 text-xs font-mono text-muted-foreground">
            MyNearWallet · Meteor · HERE Wallet. New to NEAR?{" "}
            <a
              href="https://wallet.near.org"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Create one in 30 seconds.
            </a>
          </p>
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">
            Signature recipient: {SIGN_MESSAGE_RECIPIENT}
          </p>
        </div>
      </div>
    </div>
  );
}
