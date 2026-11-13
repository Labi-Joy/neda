export type LineItem = {
  description: string;
  quantity: number;
  unitPriceUsd: number;
};

export type DepositAddress = {
  blockchain: string;
  address: string;
};

export type InvoiceStatus = "pending" | "paid" | "expired" | "refunded";

export type SupportedChain = {
  id: string;
  label: string;
  symbol: string;
};

export const SUPPORTED_CHAINS: SupportedChain[] = [
  { id: "eth", label: "Ethereum", symbol: "ETH" },
  { id: "arb", label: "Arbitrum", symbol: "ARB" },
  { id: "base", label: "Base", symbol: "BASE" },
  { id: "sol", label: "Solana", symbol: "SOL" },
  { id: "btc", label: "Bitcoin", symbol: "BTC" },
  { id: "near", label: "NEAR", symbol: "NEAR" },
];

// Near account id validator per HACKATHON.md spec
export const NEAR_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

export function isValidNearId(id: string): boolean {
  return id.length >= 2 && id.length <= 64 && NEAR_ID_REGEX.test(id);
}
