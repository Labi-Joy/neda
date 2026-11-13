import { createHash } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { NEAR_RPC_URL } from "./near-config";

// Implements NEP-413 message signature verification.
// A wallet signs sha256(serialize({ message, nonce, recipient, callbackUrl? })).
// We reproduce the serialization, verify the signature against the provided
// publicKey, then verify the public key is attached to the claimed accountId
// on NEAR mainnet (via view_access_key_list).

export type SignedMessage = {
  accountId: string;
  publicKey: string; // "ed25519:..."
  signature: string; // base64
  message: string;
  nonce: string; // base64 or hex of 32 bytes
  recipient: string;
  callbackUrl?: string;
};

// Borsh-ish serialization matching the NEP-413 standard payload.
// Layout (little-endian u32 lengths):
//   tag:        u32        = 2147484061  (0x80000000 | 413)
//   message:    string (len u32 + utf8 bytes)
//   nonce:      [u8; 32]
//   recipient:  string
//   callbackUrl: Option<string>  // 1-byte tag (0 or 1) + optional string
function serializePayload(msg: {
  message: string;
  nonce: Uint8Array;
  recipient: string;
  callbackUrl?: string;
}): Uint8Array {
  const chunks: Uint8Array[] = [];

  // tag: 2147484061 LE
  const tag = new Uint8Array(4);
  const tagView = new DataView(tag.buffer);
  tagView.setUint32(0, 2147484061, true);
  chunks.push(tag);

  // message
  const msgBytes = new TextEncoder().encode(msg.message);
  chunks.push(u32le(msgBytes.length), msgBytes);

  // nonce (must be exactly 32 bytes)
  if (msg.nonce.length !== 32) throw new Error("nonce must be 32 bytes");
  chunks.push(msg.nonce);

  // recipient
  const recBytes = new TextEncoder().encode(msg.recipient);
  chunks.push(u32le(recBytes.length), recBytes);

  // callbackUrl Option<string>
  if (msg.callbackUrl) {
    chunks.push(new Uint8Array([1]));
    const cbBytes = new TextEncoder().encode(msg.callbackUrl);
    chunks.push(u32le(cbBytes.length), cbBytes);
  } else {
    chunks.push(new Uint8Array([0]));
  }

  // concat
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function u32le(n: number): Uint8Array {
  const b = new Uint8Array(4);
  const v = new DataView(b.buffer);
  v.setUint32(0, n, true);
  return b;
}

function decodeNonce(nonce: string): Uint8Array {
  // Accept either base64 or hex. Normalize to 32 raw bytes.
  // Try base64 first.
  try {
    const buf = Buffer.from(nonce, "base64");
    if (buf.length === 32) return new Uint8Array(buf);
  } catch {}
  try {
    const buf = Buffer.from(nonce, "hex");
    if (buf.length === 32) return new Uint8Array(buf);
  } catch {}
  throw new Error("nonce must be 32 bytes (base64 or hex)");
}

function decodeEd25519PublicKey(pk: string): Uint8Array {
  if (!pk.startsWith("ed25519:")) {
    throw new Error("publicKey must be ed25519:...");
  }
  return bs58.decode(pk.slice("ed25519:".length));
}

function decodeSignature(sig: string): Uint8Array {
  // Wallet-selector returns base64.
  return new Uint8Array(Buffer.from(sig, "base64"));
}

async function viewAccountHasKey(accountId: string, publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(NEAR_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "neda-verify",
        method: "query",
        params: {
          request_type: "view_access_key_list",
          finality: "final",
          account_id: accountId,
        },
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      result?: { keys?: Array<{ public_key: string }> };
    };
    const keys = data.result?.keys ?? [];
    return keys.some((k) => k.public_key === publicKey);
  } catch {
    return false;
  }
}

export async function verifySignedMessage(signed: SignedMessage): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const { accountId, publicKey, signature, message, nonce, recipient, callbackUrl } = signed;

  if (!accountId || !publicKey || !signature || !message || !nonce || !recipient) {
    return { ok: false, reason: "missing fields" };
  }

  // Must not accept arbitrary recipients - lock to our app.
  if (recipient !== "neda.app") {
    return { ok: false, reason: "recipient mismatch" };
  }

  let payload: Uint8Array;
  try {
    const nonceBytes = decodeNonce(nonce);
    payload = serializePayload({ message, nonce: nonceBytes, recipient, callbackUrl });
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "bad payload" };
  }

  const digest = createHash("sha256").update(payload).digest();

  let pubKey: Uint8Array;
  let sig: Uint8Array;
  try {
    pubKey = decodeEd25519PublicKey(publicKey);
    sig = decodeSignature(signature);
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "bad key/sig" };
  }

  const valid = nacl.sign.detached.verify(digest, sig, pubKey);
  if (!valid) return { ok: false, reason: "signature invalid" };

  // Prove the key is attached to the claimed account.
  const hasKey = await viewAccountHasKey(accountId, publicKey);
  if (!hasKey) {
    return { ok: false, reason: "public key not attached to account" };
  }

  return { ok: true };
}
