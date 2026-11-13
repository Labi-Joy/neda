import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { InvoiceStatusWatcher } from "@/components/invoice-status-watcher";
import { ShineButton } from "@/components/shine-button";
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
  const isPaid = invoice.status === "paid";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      <div>
        <Link
          href="/app"
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          ← Back to invoices
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono text-muted-foreground">
            {invoice.id}
          </div>
          <h1 className="heading-tight mt-2 text-3xl md:text-4xl">
            {invoice.clientName}
          </h1>
        </div>
        <Badge
          variant={isPaid ? "default" : "secondary"}
          className="capitalize text-sm px-3 py-1 font-mono"
        >
          {invoice.status}
        </Badge>
      </div>

      <InvoiceStatusWatcher invoiceId={invoice.id} status={invoice.status} />

      {/* Payment link */}
      <section className="rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-muted-foreground">
            Payment link
          </div>
          <CopyButton value={publicUrl} />
        </div>
        <div className="font-mono text-sm break-all">{publicUrl}</div>
        <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <Detail label="Amount">{formatUsd(invoice.amountUsd)}</Detail>
          <Detail label="Due">
            {invoice.dueDate.toISOString().slice(0, 10)}
          </Detail>
          {invoice.clientEmail && (
            <Detail label="Client email">{invoice.clientEmail}</Detail>
          )}
          {invoice.memo && <Detail label="Memo">{invoice.memo}</Detail>}
        </div>
      </section>

      {/* Line items */}
      <section className="rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="text-xs font-mono text-muted-foreground mb-5">
          Line items
        </div>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground font-mono text-xs">
            <tr className="border-b border-border">
              <th className="text-left pb-3 font-normal">Description</th>
              <th className="text-right pb-3 pr-6 font-normal">Qty</th>
              <th className="text-right pb-3 pr-6 font-normal">Unit</th>
              <th className="text-right pb-3 font-normal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-3">{l.description}</td>
                <td className="py-3 text-right pr-6 font-mono">{l.quantity}</td>
                <td className="py-3 text-right pr-6 font-mono">
                  {formatUsd(l.unitPriceUsd)}
                </td>
                <td className="py-3 text-right font-mono">
                  {formatUsd(l.quantity * l.unitPriceUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Settled block */}
      {isPaid && invoice.txHash && (
        <section className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-mono text-emerald-600 dark:text-emerald-400">
            <span>●</span>
            <span>Settled</span>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <Detail label="Paid at">
              {invoice.paidAt?.toISOString().slice(0, 16).replace("T", " ")}
            </Detail>
            <Detail label="Received">
              {invoice.receivedAmount?.toFixed(2)}{" "}
              {invoice.receivedAsset ?? "USDC"}
            </Detail>
            <Detail label="Tx hash">
              <span className="font-mono text-xs break-all">
                {invoice.txHash}
              </span>
            </Detail>
          </div>
        </section>
      )}

      {/* Share CTA */}
      {!isPaid && (
        <section className="rounded-lg border border-border bg-card p-6 md:p-8">
          <div className="text-xs font-mono text-muted-foreground">
            Share with your client
          </div>
          <h2 className="heading-tight mt-2 text-2xl">
            One link. Any chain. Any wallet.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-prose leading-relaxed">
            Your client opens the link and sees a QR code with per-chain
            addresses. They pay with the wallet they already have. You get
            USDC on NEAR.
          </p>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <ShineButton href={publicUrl} target="_blank" rel="noreferrer">
              Preview link
            </ShineButton>
            <CopyButton value={publicUrl} variant="outline" label="Copy link" />
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-mono text-muted-foreground">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
