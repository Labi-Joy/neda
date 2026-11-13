import { cookies } from "next/headers";
import { isValidNearId } from "./types";

const COOKIE = "neda_near_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getCurrentNearId(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  return v && isValidNearId(v) ? v : null;
}

export async function setCurrentNearId(nearId: string) {
  if (!isValidNearId(nearId)) {
    throw new Error("Invalid NEAR account id");
  }
  const store = await cookies();
  store.set(COOKIE, nearId, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
}

export async function clearCurrentNearId() {
  const store = await cookies();
  store.delete(COOKIE);
}
