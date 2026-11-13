import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySignedMessage, type SignedMessage } from "@/lib/near-verify";
import { setCurrentNearId } from "@/lib/auth";

const schema = z.object({
  accountId: z.string().min(2).max(64),
  publicKey: z.string().regex(/^ed25519:/),
  signature: z.string().min(1),
  message: z.string().min(1).max(500),
  nonce: z.string().min(1),
  recipient: z.string(),
  callbackUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const signed: SignedMessage = parsed.data;
  const result = await verifySignedMessage(signed);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "verify failed" }, { status: 401 });
  }

  await setCurrentNearId(signed.accountId);
  return NextResponse.json({ ok: true, accountId: signed.accountId });
}
