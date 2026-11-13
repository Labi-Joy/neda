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

// USDC on NEAR (NEP-141)
const USDC_NEAR = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

export type CreateInvoiceDepositInput = {
  recipientNearId: string;
  amountUsd: number;
  deadlineIso: string;
};

export async function createInvoiceDeposit(
  input: CreateInvoiceDepositInput,
): Promise<QuoteResponse> {
  const amountMicroUsdc = Math.round(input.amountUsd * 1_000_000).toString();

  const quoteRequest: QuoteRequest = {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_OUTPUT,
    slippageTolerance: 100,
    originAsset: "1cs_v1:any",
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
    // One-click exposes GET /v0/quotes?filter[correlationId]=
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
