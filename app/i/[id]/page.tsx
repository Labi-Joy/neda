import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PayWidget } from "@/components/pay-widget";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { LineItem } from "@/lib/types";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) notFound();

  const lines: LineItem[] = JSON.parse(invoice.lineItems);
  const deposits = invoice.depositAddresses
    ? (JSON.parse(invoice.depositAddresses) as Record<
        string,
        { address: string; amountIn: string; correlationId: string }
      >)
    : {};

  const isPaid = invoice.status === "paid";

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader variant="public" />
      <div className="mx-auto max-w-2xl w-full px-6 py-10 space-y-8 flex-1">
        <div className="flex items-center justify-end">
          <Badge
            variant={isPaid ? "default" : "secondary"}
            className="capitalize font-mono text-xs px-2.5 py-1"
          >
            {invoice.status}
          </Badge>
        </div>

      {/* From */}
      <div>
        <div className="text-xs font-mono text-muted-foreground">
          Invoice from
        </div>
        <div className="mt-2 text-xl font-mono">{invoice.ownerNearId}</div>
      </div>

      {/* Amount card */}
      <section className="rounded-lg border border-border bg-card p-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-mono text-muted-foreground">
              Amount due
            </div>
            <div className="mt-2 text-5xl font-mono tracking-tight">
              {formatUsd(invoice.amountUsd)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-muted-foreground">Due</div>
            <div className="mt-2 text-sm font-mono">
              {invoice.dueDate.toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        {invoice.memo && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground">Memo</div>
            <div className="mt-2 text-sm">{invoice.memo}</div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <span>{l.description}</span>
                <span className="ml-3 text-xs font-mono text-muted-foreground">
                  {l.quantity} × {formatUsd(l.unitPriceUsd)}
                </span>
              </div>
              <div className="font-mono">
                {formatUsd(l.quantity * l.unitPriceUsd)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* State */}
      {isPaid ? (
        <section className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-8">
          <div className="flex items-center gap-2 text-sm font-mono text-emerald-600 dark:text-emerald-400">
            <span>●</span>
            <span>Settled</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Received {invoice.receivedAmount?.toFixed(2)}{" "}
            {invoice.receivedAsset ?? "USDC"} on NEAR,{" "}
            {invoice.paidAt?.toISOString().slice(0, 10)}
          </div>
          {invoice.txHash && (
            <div className="mt-4 text-xs font-mono break-all text-muted-foreground">
              tx: {invoice.txHash}
            </div>
          )}
        </section>
      ) : Object.keys(deposits).length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <div className="text-sm font-mono text-muted-foreground">
            Payment routing is still being set up. Refresh in a moment.
          </div>
        </section>
      ) : (
        <PayWidget invoiceId={invoice.id} deposits={deposits} />
      )}

      <p className="text-center text-xs font-mono text-muted-foreground max-w-md mx-auto leading-relaxed">
        Cross-chain settlement via NEAR Intents. Any token on any supported
        chain. The freelancer receives USDC on NEAR.
      </p>
      </div>
      <SiteFooter />
    </div>
  );
}
