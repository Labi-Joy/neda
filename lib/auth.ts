import { cookies } from "next/headers";
import { readSession, createSession, destroySession } from "./session";

// Legacy cookie name from the stub auth flow. We clear it on read so a stale
// one from earlier testing does not shadow the new wallet-verified session.
const LEGACY_COOKIE = "neda_near_id";

export async function getCurrentNearId(): Promise<string | null> {
  const nearId = await readSession();
  if (nearId) return nearId;

  // Clear any stale legacy cookie so it does not appear on later requests.
  try {
    const store = await cookies();
    if (store.get(LEGACY_COOKIE)) {
      store.delete(LEGACY_COOKIE);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function setCurrentNearId(nearId: string): Promise<void> {
  await createSession(nearId);
}

export async function clearCurrentNearId(): Promise<void> {
  await destroySession();
  try {
    const store = await cookies();
    store.delete(LEGACY_COOKIE);
  } catch {
    // ignore
  }
}
