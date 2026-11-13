import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrderStatus } from "@/lib/intents";

type IntentOrderResponse = {
  data?: Array<{
    attributes?: {
      status?: string;
      destinationAmount?: string;
      destinationAsset?: string;
      originAsset?: string;
      executionTransactionHash?: string;
      settledAt?: string;
    };
  }>;
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (invoice.status === "paid") {
    return NextResponse.json({ invoice, note: "already paid" });
  }
  if (!invoice.correlationId) {
    return NextResponse.json({ invoice, note: "no correlationId" });
  }

  const status = (await getOrderStatus(invoice.correlationId)) as IntentOrderResponse | null;
  const row = status?.data?.[0]?.attributes;
  if (!row) {
    return NextResponse.json({ invoice, note: "no order row yet" });
  }

  const upstream = (row.status || "").toLowerCase();
  const isSuccess =
    upstream === "success" ||
    upstream === "succeeded" ||
    upstream === "settled" ||
    upstream === "paid";

  if (!isSuccess) {
    return NextResponse.json({ invoice, note: `upstream: ${row.status}` });
  }

  const updated = await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "paid",
      paidAt: row.settledAt ? new Date(row.settledAt) : new Date(),
      txHash: row.executionTransactionHash || null,
      receivedAmount: row.destinationAmount
        ? Number(row.destinationAmount) / 1_000_000
        : invoice.amountUsd,
      receivedAsset: row.destinationAsset || "USDC",
    },
  });

  return NextResponse.json({ invoice: updated });
}
