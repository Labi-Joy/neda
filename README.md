# NEDA

> Invoicing that routes payments across chains, not across weeks.

NEDA is a cryptocurrency invoicing platform for freelancers who are not crypto-native. The freelancer creates an invoice. The client pays USDC from any chain (Ethereum, Arbitrum, Base, Solana) in the wallet they already use. The freelancer receives USDC on their NEAR account - no bridge, no gas, no bank in between.

The name NEDA means *voice* in Persian. The core thesis: you speak, the platform acts.

---

- **Live demo:** https://use-neda.vercel.app
- **Hackathon:** [NEAR HACKATHON 2026](https://nearhackathon.com), tracks `realworld` + `agents`
- **Status:** Hackathon submission
- **License:** MIT

---

## Why this matters

Freelancers in Lagos, Nairobi, and Accra lose 15-20% of their real income to banking delays (3-5 business days), FX spreads, and 6-8% transaction fees on cross-border payments. 68% of independent workers in Sub-Saharan Africa already prefer stablecoin payouts (industry research), but adoption is blocked by three friction points: security concerns about unverified platforms (40%), technical complexity (39%), and off-ramp friction (30%).

NEDA addresses all three. The freelancer never holds a hex address, never buys gas, never touches a bridge UI. The client pays in the asset they already understand. Settlement into USDC on NEAR takes ~2 minutes.

## What it ships with

### Core
- **One invoice, any chain in.** Create an invoice, get one link to send to your client. They open it, pick a chain, see a QR code + an exact amount + a deposit address. Pay once. USDC lands on NEAR.
- **Scoped per-chain quotes.** On invoice creation NEDA requests one 1Click quote per supported origin chain (Ethereum, Arbitrum, Base, Solana) in parallel. Each chain gets its own deposit address and exact input amount. The client never has to think about slippage.
- **Live settlement polling.** The public pay page watches the invoice state. The second 1Click reports success, the status flips to `paid`, the tx hash is captured, and the dashboard updates.
- **Accountant-ready CSV export.** Plain English column names (`date_paid`, `amount_received`, `currency_received`, `source_chain`). No hex addresses in the ledger.

### AI Command Bar
- Natural-language interface on the dashboard. Type `create invoice for Acme Co $500 due Nov 30` and the invoice is created. Type `show unpaid invoices` and a filtered list comes back. Type `export last month as csv` and a download link lands in the reply.
- **Voice input works on every browser.** Click the mic. A 5-bar waveform indicates active capture. Speak. The audio is sent to our `/api/transcribe` route which forwards to NEAR AI's Whisper endpoint (`openai/whisper-large-v3`). The transcript auto-populates the input and runs. Works in Chrome, Edge, Safari (iOS/macOS), Firefox, Chromium, Android - anywhere MediaRecorder exists.
- **One AI stack, end to end.** Both the speech-to-text and the agent reasoning run through NEAR AI's OpenAI-compatible endpoint. Same credit balance, same provider, same privacy posture.

### Authentication
- **Real NEAR wallet sign-in** via [NEAR Wallet Selector](https://github.com/near/wallet-selector). Supports HERE Wallet (mobile-native), Meteor (desktop + mobile), and MyNearWallet (desktop). HERE is listed first because it is mobile-first; MyNearWallet is configured with explicit `successUrl` / `failureUrl` so the mobile redirect round-trip returns to the right place.
- Server-side JWT session cookie issued by the wallet connection, HS256 via `jose`. 14-day expiry, httpOnly, same-site lax.

### Editable invoices
- Any invoice can be edited before it is paid: client name, email, due date, memo, line items. If the amount or due date change, 1Click is re-quoted so the per-chain deposit addresses stay accurate. Paid invoices are immutable (409).

### Share sheet
- On the invoice detail page the Share button calls `navigator.share()` on mobile, firing the OS share sheet so the freelancer picks WhatsApp, Mail, Telegram, X, iMessage, Signal, whatever is installed. Pre-filled with amount + payment link. Desktop falls back to clipboard copy with visual confirmation.

### Mobile-first UI
- Separate layouts for desktop and mobile where the content calls for it. The dashboard invoice list is a horizontal table on desktop and a card stack on mobile. The flow diagram is a 3-column fan-in on desktop and a vertical stack with connector lines on mobile. The hero headline, inputs, and padding all adapt to the viewport.
- All interactive areas are above 44px tall per Apple HIG. Form inputs are 16px font-size so iOS Safari does not zoom on focus.

### Accessibility and motion
- `prefers-reduced-motion` respected across the WebGL particle hero, scroll-triggered reveals, and voice listening animation.
- Light and dark themes with warm cream + crimson palette, no near-pure-black backgrounds. `next-themes` with system preference fallback.

## How NEAR fits in

This product is only possible because of NEAR's primitives. The following are the specific ones that are load-bearing:

### NEAR Intents (1Click API)
- On invoice create, NEDA calls `OneClickService.getQuote` with `swapType: EXACT_OUTPUT` and `destinationAsset: usdc.near` (NEP-141, the canonical USDC on NEAR). One quote per supported chain is requested in parallel.
- Each response includes a `correlationId`, a per-chain deposit address, and the exact `amountIn` the client must send to settle the invoice amount.
- The client pays to the EVM / SOL address of their choice. Market makers fulfill the intent, USDC lands in the freelancer's NEAR account within ~2 minutes.
- The sync route polls `GET /v0/quotes?filter[correlationId]=...` for every stored correlationId in parallel; first success wins.

### Zero gas for the freelancer
- The freelancer never signs a transaction to receive funds. 1Click delivers USDC into their NEAR account directly. There is no gas purchase step, no bridge UI, no swap ritual. This is the thing you cannot build this cleanly on any other chain.

### NEAR AI
- The agent reasoning (`zai-org/GLM-5.1-FP8`) and the speech-to-text (`openai/whisper-large-v3`) both run through NEAR AI's OpenAI-compatible endpoint (`https://cloud-api.near.ai/v1`). One credit balance, one provider, one privacy posture.

### Wallet Selector
- Standard NEAR identity primitive. HERE for mobile, Meteor and MyNearWallet for desktop. No custom auth broker, no third-party identity provider.

### On the roadmap
- **Meta transactions**: for v2 actions that need the freelancer to sign, wrap through a server-side relayer so they never buy NEAR for gas.
- **Rhea Finance**: passive yield on idle USDC balances.
- **Chain Signatures**: let the freelancer hold a NEAR account that transparently controls EVM funds for off-ramp.

## Try it in 2 minutes

### Live
- Open https://use-neda.vercel.app on any device
- Click **Launch app**, pick **HERE Wallet** (mobile) or **MyNearWallet** (desktop) to sign in with a real NEAR mainnet account
- Create an invoice via form or by typing in the Command Bar: `create invoice for Acme Co $25 due Nov 30`
- Click the invoice, then **Share invoice** on mobile (OS share sheet) or **Copy link** on desktop
- Open the public link in a new tab or browser - QR code, chain picker, exact amount per chain

### Local
Requires Node 22+ and pnpm 10+.

```bash
git clone https://github.com/Labi-Joy/neda.git
cd neda
pnpm install
cp .env.example .env
# fill DATABASE_URL (Postgres connection string) and NEAR_AI_API_KEY
pnpm exec prisma db push --schema prisma/schema.prisma
pnpm dev
```

Open `http://localhost:3000`.

### Zero-cost integration smoke test
A 10-check end-to-end smoke test is included. It exercises invoice CRUD, 1Click multi-chain quote generation (hits mainnet - quotes are free), mock-mode agent dispatch, and CSV formatting. Run it without touching NEAR AI credits:

```bash
pnpm exec tsx scripts/smoke.ts
```

Expected output:
```
Neda smoke test (zero cost)

  ok clean slate
  ok 1Click returns multi-chain deposit addresses
     chains: eth(10.106631), arb(10.106281), base(10.106599), sol(10.1066)
  ok mock agent: create invoice
  ok invoice persisted
  ok mock agent: list invoices
  ok mock agent: show unpaid
  ok mock agent: net-7 syntax
  ok csv export shape
  ok mock agent: export csv
  ok near id validator rejects bad input

10 passed, 0 failed
```

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack) + TypeScript
- **UI:** Tailwind 4, shadcn/ui, Space Grotesk + JetBrains Mono, framer-motion
- **3D hero:** three.js + @react-three/fiber + @react-three/drei (ported GPU particle field)
- **DB:** Postgres via Prisma 6 (Neon in prod)
- **NEAR Intents:** `@defuse-protocol/one-click-sdk-typescript` (1Click API)
- **NEAR Wallet:** `@near-wallet-selector/*` v8, `near-api-js` v4
- **AI:** NEAR AI via `openai` SDK pointed at `cloud-api.near.ai/v1` (GLM for reasoning, Whisper for voice)
- **Session:** `jose` (HS256 JWT in httpOnly cookie)
- **QR:** `qrcode.react`
- **Deploy:** Vercel

## Architecture

```
app/
  page.tsx                landing page
  loading.tsx             root loader
  i/[id]/page.tsx         public pay page (client-facing: QR + chain picker)
  app/
    layout.tsx            dashboard shell + auth gate
    page.tsx              invoice list + stats + Command Bar
    invoices/new          new invoice form
    invoices/[id]         invoice detail (owner view)
    invoices/[id]/edit    edit invoice form
    settings              NEAR account view
  api/
    auth                  DELETE (sign-out)
    auth/nonce            GET (NEP-413 ready, not currently required)
    auth/session          POST (issue session from wallet-selector connect)
    auth/verify           POST (NEP-413 signature verify - available, unused)
    invoices              GET list, POST create
    invoices/[id]         GET, PATCH
    invoices/[id]/sync    POST (reconcile 1Click order to DB)
    agent                 POST (NEAR AI tool-calling loop)
    transcribe            POST (multipart audio -> Whisper)
    export                GET (CSV download)
lib/
  db.ts                   Prisma client
  auth.ts                 session accessors
  session.ts              JWT create / read / destroy
  intents.ts              1Click wrappers (createMultiChainDeposit, getOrderStatus)
  agent.ts                NEAR AI tool-calling loop with mock-mode fallback
  record.ts               MediaRecorder helpers for voice capture
  speech.ts               (retired) Web Speech API wrapper
  near-config.ts          mainnet RPC + sign-in recipient
  near-verify.ts          NEP-413 signature verification (available, unused)
  csv.ts                  CSV export
  types.ts                shared types + NEAR id regex
components/
  near/wallet-provider.tsx    NEAR Wallet Selector context
  auth-gate.tsx               Connect wallet flow
  command-bar.tsx             AI Command Bar with voice input
  hero-background.tsx         WebGL particle field wrapper
  flow-diagram.tsx            desktop + mobile money-flow diagram
  invoice-form.tsx            create / edit form
  pay-widget.tsx              chain picker + QR + address
  share-button.tsx            navigator.share() with clipboard fallback
  site-header.tsx             shared chrome
  site-footer.tsx             shared chrome
  shine-button.tsx            CTA primitive with light-sweep shine
  gl/particles.tsx            R3F particle system
  gl/shaders/*.ts             GLSL shaders
```

## Environment

Full list in `.env.example`:

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string (Neon for prod, any Postgres for local) |
| `NEAR_AI_API_KEY` | yes | NEAR AI key from https://nearbuilders.org/dashboard ($10 free) |
| `NEAR_AI_MODEL` | yes | Default `zai-org/GLM-5.1-FP8` |
| `NEAR_AI_BASE_URL` | yes | Default `https://cloud-api.near.ai/v1` |
| `SESSION_SECRET` | yes | 32+ byte secret for JWT signing |
| `NEXT_PUBLIC_APP_URL` | prod | Public URL used to construct invoice links and wallet callbacks |
| `NEXT_PUBLIC_NEAR_NETWORK` | yes | `mainnet` (NEAR Intents is mainnet-only per Q-007) |
| `NEAR_1CLICK_JWT` | no | Removes the 0.2% Intents fee if present ([register](https://partners.near-intents.org)) |

Running without `NEAR_AI_API_KEY` is supported: the Command Bar falls into deterministic mock mode so tests and local dev work without spending credits.

## Hackathon submission

- **Tracks:** `realworld` (primary - invoicing and stablecoin rails for cross-border freelance work) and `agents` (secondary - natural-language Command Bar that executes platform actions via tool-calling).
- **Baseline per Q-002:** None. New project, all code written within the hackathon window (started 2026-11-12).
- **Mainnet-only:** NEAR Intents is mainnet-only per Q-007. All 1Click calls are mainnet; quotes are free, settlement would require real USDC.

## Honest scope

What's shipped: NEAR wallet sign-in, invoice create/edit/share/export, public pay page with per-chain addresses and live status, AI Command Bar with voice input (Whisper via NEAR AI), accountant-ready CSV export, mobile-polished UI, zero-cost smoke test.

What's explicitly out of scope for the window: payroll/recurring invoices, actual email sending to clients, team accounts, Rhea yield integration (stubbed on settings page), licensed off-ramp, mainnet payment demo (requires real USDC we did not have on hand - the integration is proven by the smoke test against real 1Click mainnet quotes).

## Credits

Built by [Labi-Joy](https://github.com/Labi-Joy) at NEAR HACKATHON 2026.

Hero WebGL particle field adapted from the [Skal Ventures template](https://skalventures.com) with the color tint and reveal behavior customized for NEDA. Motion patterns informed by @zeeuiux's Landing Page Motion Pack (hero reveal, process draw).
