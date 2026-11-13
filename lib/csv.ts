import type { Invoice } from "@prisma/client";

export function invoicesToCsv(invoices: Invoice[]): string {
  const header = [
    "date_paid",
    "client_name",
    "invoice_id",
    "amount_usd",
    "amount_received",
    "currency_received",
    "source_chain",
    "transaction_id",
    "memo",
  ];

  const rows = invoices.map((inv) => [
    inv.paidAt ? inv.paidAt.toISOString().slice(0, 10) : "",
    csvEscape(inv.clientName),
    inv.id,
    inv.amountUsd.toFixed(2),
    inv.receivedAmount?.toFixed(2) ?? "",
    inv.receivedAsset ?? "USDC",
    "NEAR via Intents",
    inv.txHash ?? "",
    csvEscape(inv.memo ?? ""),
  ]);

  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
