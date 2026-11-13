"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";

type ChainMeta = { id: string; label: string; symbol: string };

const CHAIN_META: Record<string, ChainMeta> = {
  near: { id: "near", label: "NEAR", symbol: "NEAR" },
  eth: { id: "eth", label: "Ethereum / Arbitrum / Base", symbol: "ETH" },
  sol: { id: "sol", label: "Solana", symbol: "SOL" },
  btc: { id: "btc", label: "Bitcoin", symbol: "BTC" },
  arb: { id: "arb", label: "Arbitrum", symbol: "ARB" },
  base: { id: "base", label: "Base", symbol: "BASE" },
};

export function PayWidget({
  invoiceId,
  addresses,
}: {
  invoiceId: string;
  addresses: Record<string, string>;
}) {
  const chainIds = Object.keys(addresses);
  const defaultChain =
    chainIds.includes("eth") ? "eth" : chainIds[0] ?? "";
  const [selected, setSelected] = useState(defaultChain);
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

  const addr = addresses[selected] ?? "";
  const meta = CHAIN_META[selected] ?? { id: selected, label: selected, symbol: selected };

  return (
    <Card className="p-8">
      <div className="text-sm font-medium">Pay from any chain</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a chain, scan the QR, or copy the address. Send any token on that
        chain. Intents will swap and settle to NEAR automatically.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {chainIds.map((id) => {
          const m = CHAIN_META[id] ?? { id, label: id, symbol: id };
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
          <QRCodeSVG value={addr} size={160} />
        </div>
        <div className="space-y-3 min-w-0">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              {meta.label} deposit address
            </div>
            <div className="mt-1 font-mono text-sm break-all">{addr}</div>
          </div>
          <div className="flex gap-2">
            <CopyButton value={addr} variant="default" label="Copy address" />
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Watching for payment… status updates automatically.
          </div>
        </div>
      </div>
    </Card>
  );
}
