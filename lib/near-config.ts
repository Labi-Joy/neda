// Shared NEAR network config - mainnet because Intents is mainnet-only (Q-007).

export type NearNetwork = "mainnet" | "testnet";

export const NEAR_NETWORK: NearNetwork =
  (process.env.NEXT_PUBLIC_NEAR_NETWORK as NearNetwork) || "mainnet";

export const NEAR_RPC_URL =
  NEAR_NETWORK === "mainnet"
    ? "https://rpc.mainnet.near.org"
    : "https://rpc.testnet.near.org";

export const NEDA_APP_NAME = "Neda";

// Recipient for signMessage. The wallet shows this to the user.
export const SIGN_MESSAGE_RECIPIENT = "neda.app";
