# Neda

> Freelancer invoicing on NEAR. Clients pay from any chain. You receive USDC. No wallet, no gas, no bank.

- **Live demo:** https://use-neda.vercel.app
- **Demo video:** _(link added after recording)_
- **Hackathon:** [NEAR HACKATHON 2026](https://nearhackathon.com), tracks `realworld` + `agents`
- **Status:** Hackathon submission
- **Browser note:** the Command Bar voice input uses the Web Speech API, which works in Google Chrome, Edge, and Safari. Vanilla Chromium and Firefox fall back to text-only input - no functionality lost.

---

## What this is

Neda is a cryptocurrency invoicing platform for freelancers who are unfamiliar with crypto. The freelancer creates an invoice. The client pays from any chain (Ethereum, Solana, Bitcoin, Base, Arbitrum, NEAR) using the wallet they already have. The freelancer receives USDC on their NEAR account. Settlement happens in minutes.

The whole flow is possible because of **NEAR Intents** - NEAR's cross-chain settlement layer. One deposit address per invoice, 50+ chains accepted, zero gas required from the freelancer.

On top of the invoicing core, there's an **AI Command Bar** on the dashboard - a text input powered by Claude with tool-calling into the platform's actions (create invoice, list invoices, export CSV). A freelancer can type `create invoice for Acme Co $500 due Nov 30` and ship.

The name `Neda` means *voice* in Persian. The Command Bar is the product thesis: you speak, the platform acts.

## Who it's for

Freelancers in emerging markets - specifically the ones who:

- Receive cross-border payments in USD from US/EU clients
- Lose 15-20% of their real income to banking delays (3-5 days), FX spreads, and 6-8% transaction fees
- Prefer stablecoin payouts (68% of Sub-Saharan Africa independent workers per industry research) but are blocked by security concerns, technical complexity, and off-ramp friction

## Try it in 2 minutes

### Prerequisites
- Node 22+
- pnpm 10+

### Local run
```bash
git clone https://github.com/Labi-Joy/neda.git
cd neda
pnpm install
cp .env.example .env          # fill ANTHROPIC_API_KEY to enable the Command Bar
pnpm exec prisma db push --schema prisma/schema.prisma
pnpm dev
```

Open `http://localhost:3000`.

### Judge path - see the whole product in 60 seconds

1. On the landing page, click **Launch App**.
2. Enter any valid NEAR account id (e.g. `example.near`). The input accepts named or implicit accounts per NEAR's spec.
3. On the dashboard, type in the Command Bar: `create invoice for Acme Co $500 due Nov 30`. _(Requires `ANTHROPIC_API_KEY` in `.env`.)_
4. Alternatively, click **New invoice** and fill the form manually.
5. On the invoice detail page, click **Copy link**. That URL is the public payment page.
6. Open the public link in a fresh tab - this is what the client sees. A QR code, per-chain deposit addresses, live status.
7. On mainnet, a client scans and pays from MetaMask (any EVM chain), Phantom (Solana), or Unisat (Bitcoin). The invoice status auto-flips to **Paid** within seconds of settlement.
8. Back on the dashboard, click **Export CSV** - accountant-ready, no crypto jargon in column names.

## How NEAR fits in

This product is only possible because of two NEAR primitives. Without them, the freelancer would need a bridge, a swap UX, and NEAR gas purchased from an exchange.

### NEAR Intents (1Click API)

- When an invoice is created, we call `OneClickService.getQuote` with:
  - `swapType: EXACT_OUTPUT` (client pays exactly the invoice amount)
  - `destinationAsset: usdc.near` (NEP-141)
  - `originAsset: 1cs_v1:any` (the client picks the chain/token)
  - `recipient: <freelancer NEAR account>`
  - `recipientType: DESTINATION_CHAIN`
- 1Click returns a `correlationId` plus a `depositAddress` on NEAR and one per supported chain.
- The client pays to the EVM / SOL / BTC / NEAR address of their choice. Market makers fulfill the intent and USDC lands in the freelancer's NEAR account.
- We poll `GET /v0/quotes?filter[correlationId]=...` to detect settlement, update invoice state, and surface the tx hash.

### Gasless by construction

The freelancer **never signs a transaction to receive funds**. 1Click delivers USDC into their NEAR account directly. There is no gas purchase step, no wallet pop-up, no bridge UI. This is the core product thesis - the thing you cannot build this cleanly on any other chain.

### Where other NEAR primitives fit (on the roadmap)

- **Meta transactions**: for v2 actions that need the freelancer to sign (e.g., allocating to a yield pool), wrap through a server-side relayer so they never buy NEAR for gas.
- **Rhea Finance**: for v2 passive yield on idle USDC balances.
- **Chain Signatures**: potential for allowing the freelancer to hold a custodial-feeling account that transparently controls EVM funds.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack) + TypeScript
- **UI:** Tailwind 4 + shadcn/ui
- **DB:** SQLite via Prisma 6 (dev), Postgres on Vercel (prod)
- **NEAR Intents:** `@defuse-protocol/one-click-sdk-typescript`
- **AI:** `@anthropic-ai/sdk` (Claude Sonnet 4.6) with tool-calling
- **QR:** `qrcode.react`
- **Deploy:** Vercel

## Architecture

```
app/
  page.tsx              landing (public)
  i/[id]/page.tsx       public pay page (client-facing, QR + chain picker)
  app/
    layout.tsx          dashboard shell + NEAR auth gate
    page.tsx            invoice list + stats + Command Bar
    invoices/new        new invoice form
    invoices/[id]       invoice detail (owner view)
    settings            NEAR account view
  api/
    auth                cookie-based session (POST/DELETE)
    invoices            CRUD (POST creates 1Click deposit address)
    invoices/[id]       GET
    invoices/[id]/sync  reconcile 1Click order → DB
    export              CSV
    agent               Claude tool-calling
lib/
  db.ts                 Prisma client
  auth.ts               cookie session
  intents.ts            1Click wrapper (createInvoiceDeposit, getOrderStatus)
  agent.ts              Claude tool-calling loop
  csv.ts                CSV export
  types.ts              shared types + NEAR id regex
```

## Environment

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite in dev (`file:./dev.db`), Postgres in prod |
| `ANTHROPIC_API_KEY` | optional | Enables the AI Command Bar; app runs without it |
| `NEAR_1CLICK_JWT` | optional | Removes the 0.2% fee on Intents quotes ([register](https://partners.near-intents.org)) |
| `NEXT_PUBLIC_APP_URL` | prod | Used to construct public invoice URLs in the agent and detail view |

## Hackathon submission

- **Tracks:** `realworld` (primary - invoicing / stablecoin rails for cross-border freelance), `agents` (secondary - natural-language Command Bar with tool-calling)
- **Baseline per Q-002:** None. This project is new, started 2026-11-12, all code within the hackathon window.
- **Testnet vs mainnet:** NEAR Intents is mainnet-only per Q-007. The demo pays a small real amount (~$2 USDC) from an EVM wallet on mainnet.

## Honest scope

What's shipped: invoice creation (form + AI), public pay page with per-chain addresses and QR, live status polling, dashboard, CSV export, AI Command Bar with `create_invoice` / `list_invoices` / `get_invoice` / `export_csv_url` tools.

What's explicitly cut for the 48-hour window: voice onboarding, payroll/recurring, actual email sending, team accounts, Rhea yield integration (stubbed), real local off-ramp (requires licensed partner).

## License

MIT - see [LICENSE](./LICENSE).

Built at NEAR HACKATHON 2026.
