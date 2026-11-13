import { NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { createInvoiceDeposit } from "@/lib/intents";

const lineItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(10000),
  unitPriceUsd: z.number().min(0).max(1_000_000),
});

const createSchema = z.object({
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email().optional().or(z.literal("")),
  amountUsd: z.number().min(0.01).max(1_000_000),
  dueDate: z.string().datetime().or(z.string().min(1)),
  memo: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).min(1).max(50),
});

export async function GET() {
  const nearId = await getCurrentNearId();
  if (!nearId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const invoices = await db.invoice.findMany({
    where: { ownerNearId: nearId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
  const nearId = await getCurrentNearId();
  if (!nearId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const id = ulid();

  // Due date + 7 day grace for the Intents deadline
  const dueDate = new Date(data.dueDate);
  const deadline = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  let correlationId: string | undefined;
  let depositAddresses: Record<string, string> | undefined;
  let destinationAsset: string | undefined;

  try {
    const quote = await createInvoiceDeposit({
      recipientNearId: nearId,
      amountUsd: data.amountUsd,
      deadlineIso: deadline.toISOString(),
    });

    correlationId = quote.correlationId;
    destinationAsset = "usdc.near";

    const addrs: Record<string, string> = {};
    if (quote.quote?.depositAddress) addrs.near = quote.quote.depositAddress;
    for (const chain of quote.quote?.chainDepositAddresses ?? []) {
      if (chain.blockchain && chain.address) addrs[chain.blockchain] = chain.address;
    }
    if (Object.keys(addrs).length > 0) depositAddresses = addrs;
  } catch (err) {
    console.error("1Click quote failed:", err);
    // Continue; invoice is saved without deposit addresses and can be re-synced
  }

  const invoice = await db.invoice.create({
    data: {
      id,
      ownerNearId: nearId,
      clientName: data.clientName,
      clientEmail: data.clientEmail || null,
      amountUsd: data.amountUsd,
      dueDate: dueDate,
      memo: data.memo || null,
      lineItems: JSON.stringify(data.lineItems),
      correlationId: correlationId || null,
      depositAddresses: depositAddresses ? JSON.stringify(depositAddresses) : null,
      destinationAsset: destinationAsset || null,
    },
  });

  return NextResponse.json({ invoice });
}
