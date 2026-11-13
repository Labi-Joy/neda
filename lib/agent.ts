import OpenAI from "openai";
import { ulid } from "ulid";
import { db } from "./db";
import { createMultiChainDeposit } from "./intents";

const BASE_URL = process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1";
const MODEL = process.env.NEAR_AI_MODEL || "zai-org/GLM-5.1-FP8";

const SYSTEM_PROMPT = `You are Neda, an AI assistant for a freelancer invoicing platform built on NEAR.
Your job is to help the signed-in freelancer manage invoices and payments using the provided tools.

Rules:
- Default currency is USD. Amounts are always USD unless the user is clearly asking in another currency; if so, politely explain we only support USD at this time.
- Default payment terms: "net-30" means due 30 days from today. "net-7" is 7 days. Interpret natural due dates like "end of month" into ISO dates.
- Always confirm tool outputs briefly. Keep replies under 2 sentences unless the user asks for more.
- Never fabricate an invoice id or tx hash. Only report what tools returned.
- If the user asks something outside invoice management, politely redirect.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_invoice",
      description:
        "Create a new invoice. Returns the created invoice id and the public payment URL.",
      parameters: {
        type: "object",
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
  },
  {
    type: "function",
    function: {
      name: "list_invoices",
      description: "List invoices for the signed-in freelancer, optionally filtered.",
      parameters: {
        type: "object",
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
  },
  {
    type: "function",
    function: {
      name: "get_invoice",
      description: "Get details of one invoice by id",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_csv_url",
      description:
        "Return a URL the user can click to download a CSV of paid invoices for a date range.",
      parameters: {
        type: "object",
        properties: {
          fromIso: { type: "string" },
          toIso: { type: "string" },
        },
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
  const apiKey = process.env.NEAR_AI_API_KEY;

  // Mock mode burns zero credits. Use for dev + CI + rehearsal.
  if (!apiKey || apiKey === "mock") {
    return runMockAgent(nearId, userMessage);
  }

  const client = new OpenAI({ apiKey, baseURL: BASE_URL });
  const today = new Date().toISOString().slice(0, 10);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `(today is ${today}) ${userMessage}` },
  ];

  let refresh = false;

  for (let step = 0; step < 6; step++) {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
    });

    const choice = resp.choices[0];
    const msg = choice.message;
    const toolCalls = msg.tool_calls ?? [];

    if (toolCalls.length === 0) {
      return { reply: msg.content?.trim() || "Done.", refresh };
    }

    messages.push({
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const out = await runTool(nearId, call.function.name, args);
      if (out.refresh) refresh = true;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(out.content),
      });
    }
  }

  return { reply: "Hit the step budget without a final reply.", refresh };
}

// Zero-cost mock agent for dev and rehearsal. Deterministic rules, no model.
async function runMockAgent(
  nearId: string,
  userMessage: string,
): Promise<AgentOutcome> {
  const text = userMessage.toLowerCase().trim();
  const today = new Date();

  // export (check before list so "export paid invoices as csv" doesn't fall into list)
  if (/\bexport\b|\bcsv\b/.test(text)) {
    const out = await runTool(nearId, "export_csv_url", {});
    const data = out.content as { downloadUrl: string };
    return { reply: `CSV ready: ${data.downloadUrl}`, refresh: false };
  }

  // list / show / what
  if (/\b(list|show|how many|what)\b.*\binvoices?\b/.test(text) || /\b(unpaid|pending|paid)\b/.test(text)) {
    const status = /unpaid|pending|outstanding/.test(text)
      ? "pending"
      : /^paid$|\bpaid\b/.test(text)
        ? "paid"
        : "all";
    const out = await runTool(nearId, "list_invoices", { status, limit: 10 });
    const data = out.content as {
      count: number;
      totalUsd: number;
      invoices: Array<{ clientName: string; amountUsd: number; status: string }>;
    };
    if (data.count === 0) return { reply: "No invoices match.", refresh: false };
    const lines = data.invoices
      .slice(0, 5)
      .map((i) => `  - ${i.clientName}: $${i.amountUsd.toFixed(2)} [${i.status}]`)
      .join("\n");
    return {
      reply: `${data.count} invoice(s), $${data.totalUsd.toFixed(2)} total:\n${lines}`,
      refresh: false,
    };
  }

  // create invoice
  if (/\b(create|new|generate|make|invoice|bill|charge)\b/.test(text)) {
    const amount = parseAmount(text);
    const clientName = parseClient(text);
    const dueDateIso = parseDue(text, today);

    if (!clientName || !amount) {
      return {
        reply:
          "Mock agent needs a client name and amount. Try: `create invoice for Acme Co $500 due Nov 30`.",
        refresh: false,
      };
    }

    const out = await runTool(nearId, "create_invoice", {
      clientName,
      amountUsd: amount,
      dueDateIso,
    });
    const data = out.content as {
      id: string;
      publicUrl: string;
      amountUsd: number;
      clientName: string;
    };
    return {
      reply: `Invoice created for ${data.clientName} ($${data.amountUsd.toFixed(2)}). Link: ${data.publicUrl}`,
      refresh: true,
    };
  }

  return {
    reply:
      "Mock mode. Try: `create invoice for Acme $500 due Nov 30`, `show unpaid invoices`, `export csv`.",
    refresh: false,
  };
}

function parseAmount(text: string): number | null {
  const m = text.match(/\$?\s*([0-9]+(?:[.,][0-9]+)?)\s*(k|thousand)?/i);
  if (!m) return null;
  const base = Number(m[1].replace(",", ""));
  if (!isFinite(base) || base <= 0) return null;
  return m[2] ? base * 1000 : base;
}

function parseClient(text: string): string | null {
  // prefer "for <Name>" up to amount/due marker
  const m = text.match(/\bfor\s+(.+?)(?:\s+(?:for|\$|[0-9]|due|net-|\b(?:today|tomorrow|next))|$)/i);
  if (m && m[1].trim()) return titleCase(m[1].trim());
  return null;
}

function parseDue(text: string, today: Date): string {
  const net = text.match(/net[-\s]*([0-9]+)/i);
  if (net) {
    const d = new Date(today);
    d.setDate(d.getDate() + Number(net[1]));
    return d.toISOString().slice(0, 10);
  }
  const explicit = text.match(/due\s+([a-z]+\s+\d{1,2}(?:\s*,?\s*\d{4})?|\d{4}-\d{2}-\d{2})/i);
  if (explicit) {
    const parsed = new Date(explicit[1]);
    if (!isNaN(parsed.getTime())) {
      if (parsed.getFullYear() < 2000) parsed.setFullYear(today.getFullYear());
      return parsed.toISOString().slice(0, 10);
    }
  }
  const d = new Date(today);
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
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
          const quotes = await createMultiChainDeposit({
            recipientNearId: nearId,
            amountUsd,
            deadlineIso: deadline.toISOString(),
          });
          if (quotes.length > 0) {
            correlationId = quotes[0].correlationId;
            const addrs: Record<
              string,
              { address: string; amountIn: string; correlationId: string }
            > = {};
            for (const q of quotes) {
              addrs[q.chain] = {
                address: q.depositAddress,
                amountIn: q.amountInFormatted,
                correlationId: q.correlationId,
              };
            }
            depositAddresses = JSON.stringify(addrs);
          }
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
              {
                description: memo || `Services for ${clientName}`,
                quantity: 1,
                unitPriceUsd: amountUsd,
              },
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
        return {
          refresh: false,
          content: {
            id: inv.id,
            clientName: inv.clientName,
            amountUsd: inv.amountUsd,
            status: inv.status,
            dueDate: inv.dueDate.toISOString().slice(0, 10),
            memo: inv.memo,
            paidAt: inv.paidAt?.toISOString() ?? null,
            txHash: inv.txHash,
          },
        };
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
