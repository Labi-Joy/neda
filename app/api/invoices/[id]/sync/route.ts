import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrderStatus } from "@/lib/intents";

type IntentOrderRow = {
  attributes?: {
    status?: string;
    destinationAmount?: string;
    destinationAsset?: string;
    originAsset?: string;
    executionTransactionHash?: string;
    settledAt?: string;
  };
};

type DepositMap = Record<string, { address: string; amountIn: string; correlationId: string }>;

function parseDeposits(raw: string | null): DepositMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    // Backwards compat: old shape was Record<string, string> (chain -> address)
    const first = Object.values(parsed)[0];
    if (typeof first === "string") return {};
    return parsed as DepositMap;
  } catch {
    return {};
  }
}

function isSuccessStatus(s: string | undefined): boolean {
  const upstream = (s || "").toLowerCase();
  return (
    upstream === "success" ||
    upstream === "succeeded" ||
    upstream === "settled" ||
    upstream === "paid"
  );
}

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

  // Collect every correlationId to poll (primary + per-chain)
  const deposits = parseDeposits(invoice.depositAddresses);
  const correlationIds = new Set<string>();
  if (invoice.correlationId) correlationIds.add(invoice.correlationId);
  for (const d of Object.values(deposits)) {
    if (d.correlationId) correlationIds.add(d.correlationId);
  }

  if (correlationIds.size === 0) {
    return NextResponse.json({ invoice, note: "no correlationId" });
  }

  // Poll all in parallel; first success wins.
  const results = await Promise.all(
    [...correlationIds].map(async (cid) => {
      const res = (await getOrderStatus(cid)) as { data?: IntentOrderRow[] } | null;
      return { cid, row: res?.data?.[0]?.attributes };
    }),
  );

  const winner = results.find((r) => isSuccessStatus(r.row?.status));
  if (!winner || !winner.row) {
    return NextResponse.json({
      invoice,
      note: "awaiting settlement",
      upstream: results.map((r) => ({ cid: r.cid, status: r.row?.status ?? null })),
    });
  }

  const updated = await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "paid",
      paidAt: winner.row.settledAt ? new Date(winner.row.settledAt) : new Date(),
      txHash: winner.row.executionTransactionHash || null,
      receivedAmount: winner.row.destinationAmount
        ? Number(winner.row.destinationAmount) / 1_000_000
        : invoice.amountUsd,
      receivedAsset: winner.row.destinationAsset || "USDC",
    },
  });

  return NextResponse.json({ invoice: updated });
}
