import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { InvoiceStatusWatcher } from "@/components/invoice-status-watcher";
import type { LineItem } from "@/lib/types";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const nearId = await getCurrentNearId();
  if (!nearId) return null;

  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.ownerNearId !== nearId) notFound();

  const lines: LineItem[] = JSON.parse(invoice.lineItems);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${base}/i/${invoice.id}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div>
        <Link
          href="/app"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to invoices
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {invoice.clientName}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground font-mono">
            {invoice.id}
          </div>
        </div>
        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className="capitalize text-base px-3 py-1">
          {invoice.status}
        </Badge>
      </div>

      <InvoiceStatusWatcher invoiceId={invoice.id} status={invoice.status} />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">Payment link</div>
          <CopyButton value={publicUrl} />
        </div>
        <div className="font-mono text-sm break-all">{publicUrl}</div>
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
          <Detail label="Amount">{formatUsd(invoice.amountUsd)}</Detail>
          <Detail label="Due">
            {invoice.dueDate.toISOString().slice(0, 10)}
          </Detail>
          {invoice.clientEmail && (
            <Detail label="Client email">{invoice.clientEmail}</Detail>
          )}
          {invoice.memo && <Detail label="Memo">{invoice.memo}</Detail>}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium mb-3">Line items</div>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left pb-2">Description</th>
              <th className="text-right pb-2 pr-6">Qty</th>
              <th className="text-right pb-2 pr-6">Unit</th>
              <th className="text-right pb-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right pr-6">{l.quantity}</td>
                <td className="py-2 text-right pr-6 font-mono">
                  {formatUsd(l.unitPriceUsd)}
                </td>
                <td className="py-2 text-right font-mono">
                  {formatUsd(l.quantity * l.unitPriceUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {invoice.status === "paid" && invoice.txHash && (
        <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
          <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Settled
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <Detail label="Paid at">
              {invoice.paidAt?.toISOString().slice(0, 16).replace("T", " ")}
            </Detail>
            <Detail label="Received">
              {invoice.receivedAmount?.toFixed(2)} {invoice.receivedAsset ?? "USDC"}
            </Detail>
            <Detail label="Tx hash">
              <span className="font-mono text-xs break-all">{invoice.txHash}</span>
            </Detail>
          </div>
        </Card>
      )}

      {invoice.status !== "paid" && (
        <Card className="p-6">
          <div className="text-sm font-medium mb-2">Share with your client</div>
          <p className="text-sm text-muted-foreground mb-4">
            They&apos;ll see one page with a QR code and per-chain addresses.
            They pay with the wallet they already have. You get USDC on NEAR.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                Preview link
              </a>
            </Button>
            <CopyButton value={publicUrl} variant="default" label="Copy link" />
          </div>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground tracking-wide">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
