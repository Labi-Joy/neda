import {
  OpenAPI,
  OneClickService,
  QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript";

OpenAPI.BASE = "https://1click.chaindefuser.com";
if (process.env.NEAR_1CLICK_JWT) {
  OpenAPI.TOKEN = process.env.NEAR_1CLICK_JWT;
}

// USDC on NEAR (NEP-141) - the asset the freelancer actually receives
const USDC_NEAR =
  "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

// Supported source chains. Each entry is a real tradable USDC asset on that chain,
// pulled from https://1click.chaindefuser.com/v0/tokens.
// Keep this list short at MVP to minimize quote calls per invoice (one quote per entry).
export const SUPPORTED_ORIGINS = [
  {
    chain: "eth",
    label: "Ethereum",
    asset: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
  },
  {
    chain: "arb",
    label: "Arbitrum",
    asset: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
  },
  {
    chain: "base",
    label: "Base",
    asset: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
  },
  {
    chain: "sol",
    label: "Solana",
    asset: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
  },
] as const;

export type ChainQuote = {
  chain: string;
  label: string;
  correlationId: string;
  depositAddress: string;
  amountInFormatted: string;
  amountOutFormatted: string;
};

export type CreateInvoiceDepositInput = {
  recipientNearId: string;
  amountUsd: number;
  deadlineIso: string;
};

/**
 * Backward-compatible single-chain quote: Ethereum USDC → NEAR USDC.
 * Used by tests and the AI agent path.
 */
export async function createInvoiceDeposit(
  input: CreateInvoiceDepositInput,
): Promise<QuoteResponse> {
  return getQuoteForOrigin(input, SUPPORTED_ORIGINS[0].asset);
}

/**
 * Create one quote per supported chain so the client can pay from any.
 * Returns only successful quotes; failed origin chains are dropped silently.
 */
export async function createMultiChainDeposit(
  input: CreateInvoiceDepositInput,
): Promise<ChainQuote[]> {
  const settled = await Promise.allSettled(
    SUPPORTED_ORIGINS.map((o) =>
      getQuoteForOrigin(input, o.asset).then((q) => ({ origin: o, response: q })),
    ),
  );

  const out: ChainQuote[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    const { origin, response } = r.value;
    if (!response.correlationId || !response.quote?.depositAddress) continue;
    out.push({
      chain: origin.chain,
      label: origin.label,
      correlationId: response.correlationId,
      depositAddress: response.quote.depositAddress,
      amountInFormatted: response.quote.amountInFormatted ?? "",
      amountOutFormatted: response.quote.amountOutFormatted ?? "",
    });
  }
  return out;
}

async function getQuoteForOrigin(
  input: CreateInvoiceDepositInput,
  originAsset: string,
): Promise<QuoteResponse> {
  const amountMicroUsdc = Math.round(input.amountUsd * 1_000_000).toString();

  const quoteRequest: QuoteRequest = {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_OUTPUT,
    slippageTolerance: 100,
    originAsset,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    destinationAsset: USDC_NEAR,
    amount: amountMicroUsdc,
    refundTo: input.recipientNearId,
    refundType: QuoteRequest.refundType.INTENTS,
    recipient: input.recipientNearId,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: input.deadlineIso,
  };

  return OneClickService.getQuote(quoteRequest);
}

export async function getOrderStatus(correlationId: string) {
  try {
    const res = await fetch(
      `${OpenAPI.BASE}/v0/quotes?filter[correlationId]=${encodeURIComponent(correlationId)}`,
      {
        headers: OpenAPI.TOKEN
          ? { Authorization: `Bearer ${OpenAPI.TOKEN}` }
          : {},
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}
