import Anthropic from "@anthropic-ai/sdk";
import { ulid } from "ulid";
import { db } from "./db";
import { createInvoiceDeposit } from "./intents";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are Neda — an AI assistant for a freelancer invoicing platform built on NEAR.
Your job is to help the signed-in freelancer manage invoices and payments using the provided tools.

Rules:
- Default currency is USD. Amounts are always USD unless the user is clearly asking in another currency; if so, politely explain we only support USD at this time.
- Default payment terms: "net-30" means due 30 days from today. "net-7" is 7 days. Interpret natural due dates like "end of month" into ISO dates.
- Always confirm tool outputs briefly. Keep replies under 2 sentences unless the user asks for more.
- Never fabricate an invoice id or tx hash. Only report what tools returned.
- If the user asks something outside invoice management, politely redirect.`;

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "create_invoice",
    description:
      "Create a new invoice. Returns the created invoice id and the public payment URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientName: { type: "string", description: "Client company or person name" },
        clientEmail: { type: "string", description: "Client email, optional" },
        amountUsd: { type: "number", description: "Total amount in USD" },
        dueDateIso: {
          type: "string",
          description: "Due date in YYYY-MM-DD format",
        },
        memo: { type: "string", description: "Short memo, optional" },
      },
      required: ["clientName", "amountUsd", "dueDateIso"],
    },
  },
  {
    name: "list_invoices",
    description: "List invoices for the signed-in freelancer, optionally filtered.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "paid", "expired", "refunded", "all"],
          description: "Filter by status, or 'all'",
        },
        sinceIso: {
          type: "string",
          description: "Only invoices created on or after this ISO date",
        },
        limit: { type: "integer", description: "Max rows to return, default 20" },
      },
    },
  },
  {
    name: "get_invoice",
    description: "Get details of one invoice by id",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "export_csv_url",
    description:
      "Return a URL the user can click to download a CSV of paid invoices for a date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        fromIso: { type: "string" },
        toIso: { type: "string" },
      },
    },
  },
];

type AgentOutcome = {
  reply: string;
  refresh: boolean;
};

export async function runAgent(
  nearId: string,
  userMessage: string,
): Promise<AgentOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      reply:
        "AI Command Bar is not configured. Add ANTHROPIC_API_KEY to the environment to enable.",
      refresh: false,
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today = new Date().toISOString().slice(0, 10);

  let messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: `(today is ${today}) ${userMessage}` },
  ];

  let refresh = false;

  for (let step = 0; step < 6; step++) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    if (resp.stop_reason === "end_turn" || resp.stop_reason === "stop_sequence") {
      const text = resp.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: text || "Done.", refresh };
    }

    if (resp.stop_reason !== "tool_use") {
      const text = resp.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: text || "Done.", refresh };
    }

    messages = [...messages, { role: "assistant", content: resp.content }];

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type !== "tool_use") continue;
      const out = await runTool(nearId, block.name, block.input as Record<string, unknown>);
      if (out.refresh) refresh = true;
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(out.content),
      });
    }

    messages = [...messages, { role: "user", content: toolResults }];
  }

  return { reply: "Hit the step budget without a final reply.", refresh };
}

async function runTool(
  nearId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<{ content: unknown; refresh: boolean }> {
  try {
    switch (name) {
      case "create_invoice": {
        const clientName = String(input.clientName ?? "").trim();
        const amountUsd = Number(input.amountUsd);
        const dueDateIso = String(input.dueDateIso ?? "");
        const clientEmail = input.clientEmail ? String(input.clientEmail) : null;
        const memo = input.memo ? String(input.memo) : null;

        if (!clientName) throw new Error("clientName is required");
        if (!(amountUsd > 0)) throw new Error("amountUsd must be > 0");
        if (!dueDateIso) throw new Error("dueDateIso is required");

        const dueDate = new Date(dueDateIso);
        const deadline = new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        let correlationId: string | null = null;
        let depositAddresses: string | null = null;
        try {
          const quote = await createInvoiceDeposit({
            recipientNearId: nearId,
            amountUsd,
            deadlineIso: deadline.toISOString(),
          });
          const addrs: Record<string, string> = {};
          if (quote.quote?.depositAddress) addrs.near = quote.quote.depositAddress;
          for (const chain of quote.quote?.chainDepositAddresses ?? []) {
            if (chain.blockchain && chain.address) addrs[chain.blockchain] = chain.address;
          }
          if (Object.keys(addrs).length > 0) depositAddresses = JSON.stringify(addrs);
          correlationId = quote.correlationId ?? null;
        } catch {
          /* soft-fail */
        }

        const inv = await db.invoice.create({
          data: {
            id: ulid(),
            ownerNearId: nearId,
            clientName,
            clientEmail,
            amountUsd,
            dueDate,
            memo,
            lineItems: JSON.stringify([
              { description: memo || `Services for ${clientName}`, quantity: 1, unitPriceUsd: amountUsd },
            ]),
            correlationId,
            depositAddresses,
            destinationAsset: "usdc.near",
          },
        });

        const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return {
          refresh: true,
          content: {
            id: inv.id,
            amountUsd: inv.amountUsd,
            clientName: inv.clientName,
            dueDate: inv.dueDate.toISOString().slice(0, 10),
            publicUrl: `${base}/i/${inv.id}`,
            status: inv.status,
          },
        };
      }
      case "list_invoices": {
        const status = input.status ? String(input.status) : "all";
        const sinceIso = input.sinceIso ? String(input.sinceIso) : null;
        const limit = Math.min(Number(input.limit ?? 20), 100);

        const invoices = await db.invoice.findMany({
          where: {
            ownerNearId: nearId,
            ...(status && status !== "all" ? { status } : {}),
            ...(sinceIso ? { createdAt: { gte: new Date(sinceIso) } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        return {
          refresh: false,
          content: {
            count: invoices.length,
            totalUsd: invoices.reduce((s, i) => s + i.amountUsd, 0),
            invoices: invoices.map((i) => ({
              id: i.id,
              clientName: i.clientName,
              amountUsd: i.amountUsd,
              status: i.status,
              dueDate: i.dueDate.toISOString().slice(0, 10),
              createdAt: i.createdAt.toISOString().slice(0, 10),
            })),
          },
        };
      }
      case "get_invoice": {
        const id = String(input.id ?? "");
        const inv = await db.invoice.findFirst({
          where: { id, ownerNearId: nearId },
        });
        if (!inv) return { refresh: false, content: { error: "not found" } };
        return { refresh: false, content: {
          id: inv.id,
          clientName: inv.clientName,
          amountUsd: inv.amountUsd,
          status: inv.status,
          dueDate: inv.dueDate.toISOString().slice(0, 10),
          memo: inv.memo,
          paidAt: inv.paidAt?.toISOString() ?? null,
          txHash: inv.txHash,
        } };
      }
      case "export_csv_url": {
        const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const qs = new URLSearchParams();
        if (input.fromIso) qs.set("from", String(input.fromIso));
        if (input.toIso) qs.set("to", String(input.toIso));
        const url = `${base}/api/export${qs.toString() ? `?${qs}` : ""}`;
        return { refresh: false, content: { downloadUrl: url } };
      }
      default:
        return { refresh: false, content: { error: `unknown tool: ${name}` } };
    }
  } catch (err) {
    return {
      refresh: false,
      content: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}
