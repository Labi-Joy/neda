// Zero-cost end-to-end smoke test for the Neda invoicing flow.
// Hits every backend path except the real NEAR AI model.
// Run with: pnpm tsx scripts/smoke.ts
//
// What it verifies:
//   1. Prisma client works
//   2. 1Click returns a deposit address for an invoice amount (mainnet, free - quotes are not charged)
//   3. Tool handlers behave correctly (create, list, get, export_csv_url)
//   4. Mock agent parses natural-language commands and dispatches
//   5. CSV formatter produces valid rows
// Does NOT hit:
//   - NEAR AI (uses mock agent)
//   - Any paid endpoint
//
// Expected result: all 10 checks pass. Exits non-zero on any failure.

import { db } from "../lib/db";
import { createMultiChainDeposit } from "../lib/intents";
import { runAgent } from "../lib/agent";
import { invoicesToCsv } from "../lib/csv";

// Must be a real mainnet account for 1Click's validation. example.near is a known-good public account.
const NEAR_ID = "example.near";
let passed = 0;
let failed = 0;

function pass(name: string) {
  passed++;
  console.log(`  ok ${name}`);
}

function fail(name: string, reason: unknown) {
  failed++;
  console.log(`  FAIL ${name}`);
  console.log(`    reason: ${reason instanceof Error ? reason.message : String(reason)}`);
}

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

async function main() {
  console.log("\nNeda smoke test (zero cost)\n");

  // 1. Clean slate
  await check("clean slate", async () => {
    await db.invoice.deleteMany({ where: { ownerNearId: NEAR_ID } });
  });

  // 2. 1Click returns multi-chain deposit addresses
  await check("1Click returns multi-chain deposit addresses", async () => {
    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const quotes = await createMultiChainDeposit({
      recipientNearId: NEAR_ID,
      amountUsd: 10.0,
      deadlineIso: deadline,
    });
    if (quotes.length === 0) throw new Error("no chains returned");
    for (const q of quotes) {
      if (!q.correlationId) throw new Error(`${q.chain} missing correlationId`);
      if (!q.depositAddress) throw new Error(`${q.chain} missing depositAddress`);
      if (!q.amountInFormatted) throw new Error(`${q.chain} missing amountIn`);
    }
    console.log(`     chains: ${quotes.map((q) => `${q.chain}(${q.amountInFormatted})`).join(", ")}`);
  });

  // 3. Mock agent handles "create invoice" command
  await check("mock agent: create invoice", async () => {
    delete process.env.NEAR_AI_API_KEY; // force mock
    const out = await runAgent(NEAR_ID, "create invoice for Acme Co $500 due Nov 30");
    if (!out.reply.includes("Acme Co")) throw new Error(`reply: ${out.reply}`);
    if (!out.refresh) throw new Error("expected refresh=true");
  });

  // 4. One invoice now exists
  await check("invoice persisted", async () => {
    const list = await db.invoice.findMany({ where: { ownerNearId: NEAR_ID } });
    if (list.length !== 1) throw new Error(`expected 1 invoice, got ${list.length}`);
    if (list[0].amountUsd !== 500) throw new Error(`amount: ${list[0].amountUsd}`);
    if (!list[0].clientName.toLowerCase().includes("acme")) {
      throw new Error(`client: ${list[0].clientName}`);
    }
  });

  // 5. Mock agent handles "list invoices"
  await check("mock agent: list invoices", async () => {
    const out = await runAgent(NEAR_ID, "list my invoices");
    if (!out.reply.includes("Acme")) throw new Error(`reply: ${out.reply}`);
  });

  // 6. Mock agent handles "show unpaid"
  await check("mock agent: show unpaid", async () => {
    const out = await runAgent(NEAR_ID, "show unpaid invoices");
    if (!out.reply.includes("Acme")) throw new Error(`reply: ${out.reply}`);
  });

  // 7. Mock agent handles "net-N" shorthand
  await check("mock agent: net-7 syntax", async () => {
    const out = await runAgent(NEAR_ID, "new invoice for Globex Inc $250 net-7");
    if (!out.reply.includes("Globex")) throw new Error(`reply: ${out.reply}`);
  });

  // 8. CSV export produces valid columns
  await check("csv export shape", async () => {
    // Fake a paid invoice to ensure CSV has rows
    const list = await db.invoice.findMany({ where: { ownerNearId: NEAR_ID }, take: 1 });
    await db.invoice.update({
      where: { id: list[0].id },
      data: {
        status: "paid",
        paidAt: new Date(),
        receivedAmount: 500,
        receivedAsset: "USDC",
        txHash: "0xtest123",
      },
    });
    const paid = await db.invoice.findMany({
      where: { ownerNearId: NEAR_ID, status: "paid" },
    });
    const csv = invoicesToCsv(paid);
    const lines = csv.split("\n");
    if (lines.length < 2) throw new Error("CSV should have header + at least 1 row");
    const header = lines[0];
    for (const col of [
      "date_paid",
      "client_name",
      "invoice_id",
      "amount_usd",
      "amount_received",
      "currency_received",
      "source_chain",
      "transaction_id",
      "memo",
    ]) {
      if (!header.includes(col)) throw new Error(`missing column: ${col}`);
    }
  });

  // 9. Mock agent handles "export csv"
  await check("mock agent: export csv", async () => {
    const out = await runAgent(NEAR_ID, "export my paid invoices as csv");
    if (!out.reply.toLowerCase().includes("csv")) throw new Error(`reply: ${out.reply}`);
  });

  // 10. NEAR account id validator catches garbage
  await check("near id validator rejects bad input", async () => {
    const { isValidNearId } = await import("../lib/types");
    if (isValidNearId("Not A Valid Id")) throw new Error("accepted invalid id");
    if (!isValidNearId("valid-name.near")) throw new Error("rejected valid id");
  });

  // Cleanup
  await db.invoice.deleteMany({ where: { ownerNearId: NEAR_ID } });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke test crashed:", err);
  process.exit(1);
});
