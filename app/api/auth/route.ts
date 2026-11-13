import { NextResponse } from "next/server";
import { clearCurrentNearId } from "@/lib/auth";

// POST is handled by /api/auth/verify after a wallet signature.
// Only sign-out is here now.
export async function DELETE() {
  await clearCurrentNearId();
  return NextResponse.json({ ok: true });
}
