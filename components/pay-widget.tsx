"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="p-8">
      <div className="text-sm font-medium">Pay from any chain</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a chain and send the exact amount shown. NEAR Intents will route it
        to the freelancer as USDC on NEAR within minutes.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {chainIds.map((id) => {
          const m = CHAIN_META[id] ?? { label: id };
          const active = id === selected;
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setSelected(id)}
            >
              {m.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-6 grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="bg-white p-3 rounded-lg mx-auto md:mx-0">
          <QRCodeSVG value={row.address} size={160} />
        </div>
        <div className="space-y-3 min-w-0">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              Send this amount
            </div>
            <div className="mt-1 text-2xl font-mono font-semibold">
              {row.amountIn} {meta.token}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">on {meta.label}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              To this address
            </div>
            <div className="mt-1 font-mono text-sm break-all">{row.address}</div>
          </div>
          <div className="flex gap-2 pt-1">
            <CopyButton value={row.address} variant="default" label="Copy address" />
            <CopyButton value={row.amountIn} variant="outline" label="Copy amount" />
          </div>
          <div className="text-xs text-muted-foreground pt-3 border-t border-border">
            Watching for payment. Status updates automatically.
          </div>
        </div>
      </div>
    </Card>
  );
}
