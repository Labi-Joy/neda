"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  setupWalletSelector,
  type WalletSelector,
  type WalletModuleFactory,
} from "@near-wallet-selector/core";
import {
  setupModal,
  type WalletSelectorModal,
} from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { NEAR_NETWORK } from "@/lib/near-config";
import "@near-wallet-selector/modal-ui/styles.css";

type Ctx = {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  openModal: () => void;
  signOut: () => Promise<void>;
};

const WalletCtx = createContext<Ctx>({
  selector: null,
  modal: null,
  accountId: null,
  openModal: () => {},
  signOut: async () => {},
});

function originUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return window.location.origin + path;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    (async () => {
      const callbackUrl = originUrl("/app");
      const sel = await setupWalletSelector({
        network: NEAR_NETWORK,
        modules: [
          // HERE Wallet first - best mobile UX, native app with deep links.
          setupHereWallet() as WalletModuleFactory,
          // Meteor second - works on desktop (extension) and mobile Safari.
          setupMeteorWallet() as WalletModuleFactory,
          // MyNearWallet last - desktop-oriented, fragile on mobile but
          // familiar to long-time NEAR users.
          setupMyNearWallet({
            successUrl: callbackUrl,
            failureUrl: callbackUrl,
          }) as WalletModuleFactory,
        ],
      });
      const m = setupModal(sel, {
        contractId: "",
        description: "Sign in to NEDA to issue invoices and track payments.",
      });

      const state = sel.store.getState();
      const active = state.accounts.find((a) => a.active) ?? state.accounts[0];
      if (active) {
        setAccountId(active.accountId);
        // If wallet-selector restored a session but our server session was
        // dropped (fresh device, cookies cleared, cross-redirect), establish
        // the server session so the dashboard renders without a second step.
        await ensureServerSession(active.accountId);
      }

      const sub = sel.store.observable.subscribe(async (s) => {
        const a = s.accounts.find((x) => x.active) ?? s.accounts[0];
        const id = a?.accountId ?? null;
        setAccountId(id);
        if (id) await ensureServerSession(id);
      });

      setSelector(sel);
      setModal(m);

      return () => sub.unsubscribe();
    })();
  }, []);

  const openModal = useCallback(() => modal?.show(), [modal]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    setAccountId(null);
    if (!selector) return;
    try {
      const state = selector.store.getState();
      const hasAccount = state.accounts.some((a) => a.active);
      if (!hasAccount) return;
      const wallet = await selector.wallet();
      await wallet.signOut();
    } catch {
      // ignore
    }
  }, [selector]);

  return (
    <WalletCtx.Provider
      value={{ selector, modal, accountId, openModal, signOut }}
    >
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  return useContext(WalletCtx);
}

// Posts to /api/auth/session which creates a server-side JWT session cookie
// for the given NEAR account id. Idempotent - safe to call on every mount.
// The route trusts the wallet-selector connection as proof of possession.
async function ensureServerSession(nearId: string): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nearId }),
    });
  } catch {
    // swallow - the user will land on AuthGate which re-triggers this.
  }
}
