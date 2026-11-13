import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PayWidget } from "@/components/pay-widget";
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
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/"
          className="font-semibold tracking-tight text-lg text-muted-foreground"
        >
          neda
        </a>
        <Badge variant={isPaid ? "default" : "secondary"} className="capitalize">
          {invoice.status}
        </Badge>
      </div>

      <div>
        <div className="text-xs uppercase text-muted-foreground tracking-wider">
          Invoice from
        </div>
        <div className="mt-1 text-lg font-medium font-mono">
          {invoice.ownerNearId}
        </div>
      </div>

      <Card className="p-8">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Amount due</div>
            <div className="mt-1 text-4xl font-semibold tracking-tight font-mono">
              {formatUsd(invoice.amountUsd)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              Due
            </div>
            <div className="mt-1 text-sm">
              {invoice.dueDate.toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        {invoice.memo && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs uppercase text-muted-foreground tracking-wide">
              Memo
            </div>
            <div className="mt-1 text-sm">{invoice.memo}</div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div className="text-muted-foreground">
                {l.description}
                <span className="text-xs ml-2">
                  {l.quantity} × {formatUsd(l.unitPriceUsd)}
                </span>
              </div>
              <div className="font-mono">
                {formatUsd(l.quantity * l.unitPriceUsd)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isPaid ? (
        <Card className="p-8 border-emerald-500/30 bg-emerald-500/5 text-center">
          <div className="text-emerald-700 dark:text-emerald-400 font-medium">
            This invoice is paid
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Received {invoice.receivedAmount?.toFixed(2)}{" "}
            {invoice.receivedAsset ?? "USDC"} on{" "}
            {invoice.paidAt?.toISOString().slice(0, 10)}
          </div>
          {invoice.txHash && (
            <div className="mt-3 text-xs font-mono break-all text-muted-foreground">
              tx: {invoice.txHash}
            </div>
          )}
        </Card>
      ) : Object.keys(deposits).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Payment routing is still being set up. Refresh in a moment.
        </Card>
      ) : (
        <PayWidget invoiceId={invoice.id} deposits={deposits} />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Paid with cross-chain settlement via NEAR Intents. Any token on any
        supported chain - your freelancer receives USDC on NEAR.
      </p>
    </div>
  );
}
