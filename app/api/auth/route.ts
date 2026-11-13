import { NextResponse } from "next/server";
import { z } from "zod";
import { setCurrentNearId, clearCurrentNearId } from "@/lib/auth";
import { NEAR_ID_REGEX } from "@/lib/types";

const schema = z.object({
  nearId: z.string().min(2).max(64).regex(NEAR_ID_REGEX),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid NEAR id" }, { status: 400 });
  }
  await setCurrentNearId(parsed.data.nearId.toLowerCase());
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearCurrentNearId();
  return NextResponse.json({ ok: true });
}
