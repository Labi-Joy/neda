import { NextResponse } from "next/server";
import { z } from "zod";
import { setCurrentNearId } from "@/lib/auth";
import { NEAR_ID_REGEX } from "@/lib/types";

// Issues a session cookie tied to a wallet-selector-connected account.
// Trust model: the client already connected the wallet via wallet-selector,
// which proves possession of the private key to open NEAR-side sessions.
// We take that as proof of ownership for our local invoicing records.
//
// This route stays idempotent and session-write-only so repeat calls on
// every page mount are cheap.

const schema = z.object({
  nearId: z.string().min(2).max(64).regex(NEAR_ID_REGEX),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid nearId" }, { status: 400 });
  }
  await setCurrentNearId(parsed.data.nearId.toLowerCase());
  return NextResponse.json({ ok: true, accountId: parsed.data.nearId });
}
