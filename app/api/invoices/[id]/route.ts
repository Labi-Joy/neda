import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { createMultiChainDeposit } from "@/lib/intents";

const lineItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(10000),
  unitPriceUsd: z.number().min(0).max(1_000_000),
});

const patchSchema = z.object({
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email().optional().or(z.literal("")),
  amountUsd: z.number().min(0.01).max(1_000_000),
  dueDate: z.string().datetime().or(z.string().min(1)),
  memo: z.string().max(500).optional(),
  lineItems: z.array(lineItemSchema).min(1).max(50),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ invoice });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const nearId = await getCurrentNearId();
  if (!nearId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.invoice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (existing.ownerNearId !== nearId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (existing.status === "paid") {
    return NextResponse.json(
      { error: "cannot edit a paid invoice" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const dueDate = new Date(data.dueDate);
  const deadline = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const amountChanged = data.amountUsd !== existing.amountUsd;
  const dueDateChanged = dueDate.getTime() !== existing.dueDate.getTime();
  const shouldRequote = amountChanged || dueDateChanged;

  let correlationId = existing.correlationId;
  let depositAddresses = existing.depositAddresses;
  const destinationAsset = existing.destinationAsset ?? "usdc.near";

  if (shouldRequote) {
    try {
      const quotes = await createMultiChainDeposit({
        recipientNearId: nearId,
        amountUsd: data.amountUsd,
        deadlineIso: deadline.toISOString(),
      });
      if (quotes.length > 0) {
        correlationId = quotes[0].correlationId;
        const addrs: Record<
          string,
          { address: string; amountIn: string; correlationId: string }
        > = {};
        for (const q of quotes) {
          addrs[q.chain] = {
            address: q.depositAddress,
            amountIn: q.amountInFormatted,
            correlationId: q.correlationId,
          };
        }
        depositAddresses = JSON.stringify(addrs);
      }
    } catch (err) {
      console.error("re-quote failed on edit:", err);
      // Keep stale addresses; the UI will prompt the user to refresh.
    }
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: {
      clientName: data.clientName,
      clientEmail: data.clientEmail || null,
      amountUsd: data.amountUsd,
      dueDate,
      memo: data.memo || null,
      lineItems: JSON.stringify(data.lineItems),
      correlationId,
      depositAddresses,
      destinationAsset,
    },
  });

  return NextResponse.json({ invoice });
}
