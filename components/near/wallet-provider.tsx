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
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
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

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    (async () => {
      const sel = await setupWalletSelector({
        network: NEAR_NETWORK,
        modules: [
          setupMyNearWallet() as WalletModuleFactory,
          setupMeteorWallet() as WalletModuleFactory,
          setupHereWallet() as WalletModuleFactory,
        ],
      });
      const m = setupModal(sel, {
        contractId: "",
        description: "Sign in to Neda to issue and manage invoices.",
      });
      const state = sel.store.getState();
      const active = state.accounts.find((a) => a.active) ?? state.accounts[0];
      if (active) setAccountId(active.accountId);

      const sub = sel.store.observable.subscribe((s) => {
        const a = s.accounts.find((x) => x.active) ?? s.accounts[0];
        setAccountId(a?.accountId ?? null);
      });

      setSelector(sel);
      setModal(m);

      return () => sub.unsubscribe();
    })();
  }, []);

  const openModal = useCallback(() => modal?.show(), [modal]);

  const signOut = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
    await fetch("/api/auth", { method: "DELETE" });
  }, [selector]);

  return (
    <WalletCtx.Provider value={{ selector, modal, accountId, openModal, signOut }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  return useContext(WalletCtx);
}
