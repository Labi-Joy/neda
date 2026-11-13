import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

// Returns a fresh 32-byte nonce for sign-in message. The client sends this
// back to /api/auth/verify along with the signature. We do not store it
// server-side because signature verification + public-key-on-account check
// is already stateless and sufficient for our scope.

export async function GET() {
  const nonce = randomBytes(32).toString("base64");
  return NextResponse.json({
    nonce,
    recipient: "neda.app",
    message: "Sign in to Neda. This signature does not authorize any payment.",
  });
}
