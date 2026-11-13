"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/copy-button";

type DepositRow = { address: string; amountIn: string; correlationId: string };

const CHAIN_META: Record<string, { label: string; token: string }> = {
  near: { label: "NEAR", token: "USDC" },
  eth: { label: "Ethereum", token: "USDC" },
  arb: { label: "Arbitrum", token: "USDC" },
  base: { label: "Base", token: "USDC" },
  sol: { label: "Solana", token: "USDC" },
  btc: { label: "Bitcoin", token: "BTC" },
};

export function PayWidget({
  invoiceId,
  deposits,
}: {
  invoiceId: string;
  deposits: Record<string, DepositRow>;
}) {
  const chainIds = Object.keys(deposits);
  const [selected, setSelected] = useState(chainIds[0] ?? "");
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/sync`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (data?.invoice?.status === "paid") {
          router.refresh();
          if (timer.current) clearInterval(timer.current);
        }
      } catch {
        // ignore
      }
    };
    tick();
    timer.current = setInterval(tick, 10_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [invoiceId, router]);

  const row = deposits[selected];
  const meta = CHAIN_META[selected] ?? { label: selected, token: "USDC" };

  if (!row) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6 md:p-8">
      <div className="text-xs font-mono text-muted-foreground">Pay from</div>
      <h2 className="heading-tight mt-2 text-xl sm:text-2xl">
        Any chain. Same minute.
      </h2>

      {/* Chain tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {chainIds.map((id) => {
          const m = CHAIN_META[id] ?? { label: id };
          const active = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {active && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
              )}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Amount + address */}
      <div className="mt-6 sm:mt-8 grid md:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-start">
        <div className="bg-white p-3 rounded-md mx-auto md:mx-0">
          <QRCodeSVG value={row.address} size={168} />
        </div>
        <div className="space-y-4 sm:space-y-5 min-w-0">
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              Send exactly
            </div>
            <div className="mt-2 text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight break-all">
              {row.amountIn}{" "}
              <span className="text-muted-foreground text-xl sm:text-2xl">
                {meta.token}
              </span>
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-1">
              on {meta.label}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              To this address
            </div>
            <div className="mt-2 font-mono text-sm break-all">
              {row.address}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CopyButton
              value={row.address}
              variant="default"
              label="Copy address"
            />
            <CopyButton
              value={row.amountIn}
              variant="outline"
              label="Copy amount"
            />
          </div>
        </div>
      </div>

      {/* Watcher status */}
      <div className="mt-8 pt-5 border-t border-border flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span>Watching for payment. Status updates automatically.</span>
      </div>
    </section>
  );
}
