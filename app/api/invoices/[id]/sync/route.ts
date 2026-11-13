import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getOrderStatusByDeposit,
  extractHash,
  type OneClickStatus,
} from "@/lib/intents";

type DepositMap = Record<
  string,
  { address: string; amountIn: string; correlationId: string }
>;

function parseDeposits(raw: string | null): DepositMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    const first = Object.values(parsed)[0];
    if (typeof first === "string") return {};
    return parsed as DepositMap;
  } catch {
    return {};
  }
}

// 1Click status strings we treat as "paid".
function isSuccessStatus(s: string | undefined): boolean {
  const upstream = (s || "").toUpperCase();
  return (
    upstream === "SUCCESS" ||
    upstream === "COMPLETED" ||
    upstream === "SETTLED" ||
    upstream === "PAID"
  );
}

function isRefunded(s: string | undefined): boolean {
  const u = (s || "").toUpperCase();
  return u === "REFUNDED" || u === "FAILED_REFUNDED";
}

function pickTxHash(d: OneClickStatus["swapDetails"]): string | null {
  if (!d) return null;
  // Destination (NEAR) tx is the clearest receipt of USDC landing on the
  // freelancer's account. Fall back to near intent tx or origin chain tx.
  return (
    extractHash(d.destinationChainTxHashes?.[0]) ??
    extractHash(d.nearTxHashes?.[0]) ??
    extractHash(d.originChainTxHashes?.[0])
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json({ invoice, note: "already paid" });
  }

  const deposits = parseDeposits(invoice.depositAddresses);
  const addresses = new Set<string>();
  for (const d of Object.values(deposits)) {
    if (d.address) addresses.add(d.address);
  }

  if (addresses.size === 0) {
    return NextResponse.json({ invoice, note: "no deposit addresses" });
  }

  // Poll every per-chain deposit address in parallel.
  const results = await Promise.all(
    [...addresses].map(async (address) => {
      const status = await getOrderStatusByDeposit(address);
      return { address, status };
    }),
  );

  const winner = results.find((r) => isSuccessStatus(r.status?.status));
  if (winner && winner.status) {
    const d = winner.status.swapDetails;
    const receivedMicro = d?.amountOut ? Number(d.amountOut) : null;
    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        paidAt: winner.status.updatedAt
          ? new Date(winner.status.updatedAt)
          : new Date(),
        txHash: pickTxHash(d),
        receivedAmount: receivedMicro
          ? receivedMicro / 1_000_000
          : invoice.amountUsd,
        receivedAsset: "USDC",
      },
    });
    return NextResponse.json({ invoice: updated });
  }

  const refund = results.find((r) => isRefunded(r.status?.status));
  if (refund) {
    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "refunded" },
    });
    return NextResponse.json({ invoice: updated, note: "refunded upstream" });
  }

  return NextResponse.json({
    invoice,
    note: "awaiting settlement",
    upstream: results.map((r) => ({
      address: r.address,
      status: r.status?.status ?? null,
      depositedAmount: r.status?.swapDetails?.depositedAmountFormatted ?? null,
    })),
  });
}
