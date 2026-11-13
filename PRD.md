# Neda - Technical PRD

**Status:** Locked for hackathon build (2026-11-13 to 2026-11-14)
**Hackathon:** NEAR HACKATHON, submission deadline 2026-11-14T23:59:00Z
**Target tracks:** `realworld` (primary), `agents` (secondary)
**Working name:** Neda (short, memorable, cross-border trade feel - rename on Day 2 if we land a better one)

---

## 1. One-sentence pitch

A cryptocurrency invoicing platform for freelancers unfamiliar with crypto: freelancers generate invoices, clients pay from any chain or token, freelancers receive USDC on NEAR without buying gas or touching a wallet UI.

This is a word-for-word match to the `realworld` track's core prompt. Differentiation lives in execution + an AI command layer + the African-freelancer narrative.

## 2. Why this wins

- **Only-on-NEAR thesis:** NEAR Intents (1Click API) is the one primitive that lets a client pay from Ethereum/Solana/BTC in their native wallet while the freelancer receives USDC on NEAR with zero gas. No bridge UX, no manual swap, no gas purchase.
- **Emotional hook:** Lagos/Nairobi/Accra freelancer, US client, 15-20% income erosion from legacy rails. The narrative plays wherever the clip lands.
- **Track-prompt literalism:** The judges wrote the prompt. We ship the prompt. CSV export, status tracking, gasless, deposit address - every requirement satisfied.
- **Differentiator layer on top:** AI "Command Bar" in dashboard. Freelancer types or speaks `generate invoice for Acme Co $500 net-30` and it ships. Three-track eligibility (realworld + agents).

## 3. Scope - what ships

### MVP (must have, Day 1 + first half of Day 2)
1. **Auth** - NEAR account via wallet selector (MyNearWallet / Meteor). Email-only onboarding stub if wallet is friction.
2. **Invoice create** - form: client name, email, line items, amount USD, due date, memo. Persisted locally.
3. **Invoice link** - shareable public `/i/[id]` page. Shows amount, line items, QR code, per-chain deposit addresses, status badge.
4. **1Click integration** - on invoice create, call 1Click `getQuote` with `EXACT_OUTPUT` + `destinationAsset=USDC-on-NEAR`. Store `correlationId` + `depositAddress` + `chainDepositAddresses`.
5. **Status polling** - background job (or server-triggered on page load) that polls 1Click orders API and updates invoice state: `pending` → `paid` → `refunded`.
6. **Freelancer dashboard** - list of invoices, filters, totals (gross earned, pending). Row-click opens detail view with the public link + tx hash.
7. **CSV export** - paid invoices to CSV with columns: date, client, invoice #, amount USD, currency received, chain, tx hash.
8. **Landing page** - hero with Lagos/US-client narrative, three-step flow illustration, "launch app" CTA.

### Differentiation (second half of Day 2)
9. **AI Command Bar** - persistent input on dashboard. Natural language: `create invoice for Acme Co $500 due Nov 30`, `show me unpaid invoices from October`, `export last quarter as CSV`. Backed by Claude API with tool-calling mapped to our actions.
10. **Policy YAML (stretch)** - freelancer can set `on-paid` rules (e.g., `40% to savings, 60% stays liquid`). For MVP, savings is a stub tagged "deposited to Rhea pool (demo)". Real Rhea integration only if time.

### Explicit cuts (do not build)
- Voice onboarding (nice idea, 4h sink).
- Aave / Uniswap (not on NEAR - we swapped to Rhea, see above).
- Real off-ramp to local bank (requires licensed partner).
- Payroll / recurring invoices.
- Mobile app.
- Multi-user / team accounts.
- Branded email sending.
- OAuth, Google/GitHub login.
- Dark mode toggle.
- Password reset.

## 4. Architecture

### Stack
- **Framework:** Next.js 15 (App Router), TypeScript, Node 22.
- **UI:** shadcn/ui on Tailwind 4. Install via shadcn skill.
- **Auth / NEAR:** `near-wallet-selector` + `near-api-js`.
- **Intents:** `@defuse-protocol/one-click-sdk-typescript`.
- **AI agent:** `@anthropic-ai/sdk` (Claude Sonnet 4.6) with tool-calling. Server-side route, client streams.
- **DB:** SQLite via Prisma for dev + Vercel Postgres on prod (or Vercel KV if faster). Decide at scaffold time.
- **Deploy:** Vercel.
- **Testing:** Playwright (webapp-testing skill) for one happy-path smoke only.

### Routes
```
/                             landing
/app                          dashboard (requires account)
/app/invoices/new             create invoice form
/app/invoices/[id]            invoice detail (owner view)
/app/settings                 NEAR account, API key, policy (stretch)
/i/[id]                       public invoice payment page
/api/invoices                 CRUD
/api/invoices/[id]/sync       force status refresh from 1Click
/api/intents/quote            server-side wrapper around 1Click (hides JWT)
/api/agent                    Claude tool-calling endpoint
/api/export                   CSV export
```

### Data model
```
Invoice
  id            string        // ulid
  ownerNearId   string        // freelancer NEAR account
  clientName    string
  clientEmail   string
  amountUsd     decimal
  dueDate       date
  memo          string
  lineItems     json          // [{desc, qty, price}]
  status        enum          // pending, paid, expired, refunded
  correlationId string        // 1Click order id
  depositAddresses json       // { near, eth, sol, btc, ... }
  destinationAsset string     // usdc.near NEP-141 contract
  paidAt        timestamp?
  txHash        string?
  receivedAmount decimal?     // actual USDC received
  receivedAsset string?       // the token the client sent
  createdAt     timestamp
```

### 1Click integration shape
- On invoice create:
  - `swapType: EXACT_OUTPUT`
  - `destinationAsset: nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (USDC-on-NEAR)
  - `originAsset: 1cs_v1:any`
  - `amount: invoice.amountUsd * 1e6` (USDC is 6 decimals)
  - `recipient: invoice.ownerNearId`
  - `recipientType: DESTINATION_CHAIN`
  - `refundTo: SENDER_FALLBACK` - set to a system account for refunds, or require client to provide one on invoice page
  - `deadline: dueDate + 7d`
- Persist `correlationId` + `depositAddress` + `chainDepositAddresses`.
- Poll `GET /v0/orders?filter[correlationId]=...` every 10s on invoice detail page (SSE optional stretch).

### Gasless freelancer flow
- Freelancer **never signs a tx to receive**. 1Click deposits into their NEAR account automatically.
- For actions requiring freelancer signature (e.g., Rhea deposit), use NEAR meta transactions with a server-side relayer (or sign client-side since receiving USDC isn't blocking).

### AI agent tool interface
```ts
tools: [
  { name: 'create_invoice', input: { clientName, amountUsd, dueDate, memo } },
  { name: 'list_invoices', input: { status?, since?, limit? } },
  { name: 'get_invoice', input: { id } },
  { name: 'export_csv', input: { from, to } },
  { name: 'resend_invoice', input: { id, channel: 'email'|'copy' } },
]
```
Server route takes a natural-language message, loops Claude tool-calling, returns the rendered result + any side effects.

## 5. Success criteria (what makes this a top-3 realworld submission)

Non-negotiable:
- [ ] Public repo with reproducible README (judges will clone and open)
- [ ] One complete testnet or mainnet-small-amount payment captured in demo video
- [ ] Deploy on Vercel at a shareable URL
- [ ] CSV export works
- [ ] Status polling visibly updates
- [ ] Landing clip-ready in under 60s: "Lagos dev invoices Acme in US for $500 → Acme pays from MetaMask on Ethereum → freelancer receives USDC on NEAR, status flips to Paid, dashboard shows receipt"

Strongly preferred:
- [ ] AI Command Bar works for at least `create_invoice` and `list_invoices`
- [ ] README has "do X, see Y" steps for AI pre-screening (Q-017)
- [ ] Explicit NEAR primitive section: Intents, deposit addresses, how gasless works

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| 1Click JWT auth needed, we don't have one in time | Q-006 - JWT is optional, 0.2% fee without it. Skip JWT for MVP. Register at partners.near-intents.org if we have 20 spare minutes. |
| No Intents testnet (Q-007) | Use mainnet with tiny amount ($1-2 USDC) for final demo tx. Local/screencast for development loop. |
| NEAR wallet selector friction on first use | Add a "no wallet? just use a named account" stub that validates format and stores it. Full sign-in optional. |
| Rhea SDK undocumented in time | Stub yield deposit as DB-only state. Mark as "demo" in README. |
| Vercel cold starts eat polling budget | Use client-side `setInterval` polling against our own API, not direct to 1Click. Cache aggressively. |
| Claude API key leak | Server-only route, env var, never in client bundle. |

## 7. Deliverables for submission (per HACKATHON.md §Procedure)

- [ ] Public GitHub repo (owner: Labi-Joy)
- [ ] README structured for AI pre-screening: machine-readable "do X, see Y" plus a human-first narrative above it
- [ ] LICENSE file (MIT)
- [ ] Demo video (local or hosted), 60-90s, lead with user problem
- [ ] X post with @NEARProtocol, #NEARHackathon tags, video attached
- [ ] Hosted demo URL on Vercel (kept live through 2026-11-25)
- [ ] One real payment tx hash referenced in README + X post
- [ ] Submission API POST with correct payload (tracks: `["realworld", "agents"]`)

## 8. Baseline declaration (Q-002)

This project is new, started 2026-11-12. No pre-hackathon baseline to declare. All code in-window.

## 9. Out-of-scope clarifications

- **Not a real remittance company.** The off-ramp is a UI stub.
- **Not an audited product.** Testnet-grade security, hackathon demo only.
- **Not production-ready auth.** NEAR account-string input, no verification of ownership at this scope.
- **English only.** i18n is explicitly out.
