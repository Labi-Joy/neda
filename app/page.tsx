import { HeroCommand } from "@/components/hero-command";
import { HeroHeadline } from "@/components/hero-headline";
import { FlowDiagram } from "@/components/flow-diagram";
import { CtaSuccess } from "@/components/cta-success";
import { HeroBackground } from "@/components/hero-background";
import { ShineButton } from "@/components/shine-button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <main className="flex-1">
      <SiteHeader variant="public" />

      {/* HERO - split: headline on left, Command Bar on right */}
      <section className="relative overflow-hidden">
        <HeroBackground />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklch, var(--background) 25%, transparent) 0%, color-mix(in oklch, var(--background) 70%, transparent) 60%, var(--background) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-10 md:pt-20 pb-16 sm:pb-20 md:pb-28">
          <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-center">
            <div className="md:col-span-6 lg:col-span-7">
              <div className="text-xs font-mono text-muted-foreground">
                Built for NEAR HACKATHON · Real-World Money
              </div>
              <div className="mt-8">
                <HeroHeadline />
              </div>
              <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Your US client pays USDC on Ethereum. You get USDC on NEAR.
                Two minutes, no bridge, no gas, no bank.
              </p>
              <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-5">
                <ShineButton href="/app" size="lg">
                  Create your first invoice
                </ShineButton>
                <a
                  href="#how"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  See the flow
                </a>
              </div>
            </div>

            <div className="md:col-span-6 lg:col-span-5">
              <HeroCommand />
              <p className="mt-4 text-xs font-mono text-muted-foreground">
                Powered by NEAR AI. NEDA means <em>voice</em> in Persian.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MONEY FLOW */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-start">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                The flow
              </div>
              <h2 className="heading-tight mt-4 text-3xl sm:text-4xl md:text-5xl leading-[1.05] md:leading-[1.02]">
                One invoice. One link. Any chain in.
              </h2>
              <p className="mt-6 text-base text-muted-foreground leading-relaxed">
                The freelancer generates an invoice. The client opens the link,
                picks their chain, sends the exact amount. NEAR Intents routes
                the swap and settles USDC into the freelancer&apos;s NEAR
                account. The freelancer never buys gas, never signs a bridge,
                never touches a wallet UI.
              </p>
            </div>
            <div className="md:col-span-7">
              <FlowDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* WHY NEAR */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="grid md:grid-cols-12 gap-8 md:gap-10">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                Why NEAR specifically
              </div>
              <h2 className="heading-tight mt-4 text-3xl sm:text-4xl md:text-5xl leading-[1.05] md:leading-[1.02]">
                The one primitive that makes this possible.
              </h2>
            </div>
            <div className="md:col-span-7">
              <dl className="space-y-6 text-base">
                <WhyRow
                  label="Intents"
                  body="Any origin asset on any supported chain resolves into USDC on NEAR. We request one quote per chain, store the per-chain deposit addresses, and show the client exactly how much to send."
                />
                <WhyRow
                  label="Zero gas for the freelancer"
                  body="The freelancer never signs a receive transaction. USDC lands in their NEAR account automatically when the client pays."
                />
                <WhyRow
                  label="NEAR AI"
                  body="The Command Bar runs on NEAR AI's OpenAI-compatible inference. Open-weight models, same privacy posture as the rest of the stack."
                />
                <WhyRow
                  label="Accountant-ready"
                  body="Paid invoices export to CSV with plain-English columns. No hex addresses in the ledger."
                />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="grid md:grid-cols-12 gap-8 md:gap-10">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                Why this lasts
              </div>
              <h2 className="heading-tight mt-4 text-3xl sm:text-4xl md:text-5xl leading-[1.05] md:leading-[1.02]">
                Built so the platform going away is not a catastrophe.
              </h2>
            </div>
            <div className="md:col-span-7">
              <dl className="space-y-6 text-base">
                <WhyRow
                  label="Non-custodial"
                  body="Funds settle directly to the freelancer's NEAR account. We never hold money. We have no keys to lose."
                />
                <WhyRow
                  label="Open source"
                  body="MIT. Clone, read, fork. The invoice records live on NEAR and in a plain database the freelancer owns."
                />
                <WhyRow
                  label="Emerging markets first"
                  body="Lagos, Nairobi, Accra. Built for the places where banking rails fail cross-border contract work. USD-denominated settlement so a 60% naira depreciation doesn't quietly erode a year's income."
                />
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="heading-tight text-3xl sm:text-4xl md:text-6xl leading-[1.05] md:leading-[1.02]">
              Invoice an overseas client in the next two minutes.
            </h2>
            <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-5">
              <CtaSuccess href="/app" label="Create your first invoice" />
              <a
                href="https://github.com/Labi-Joy/neda"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Read the source
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function WhyRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[auto_1fr] gap-2 md:gap-x-6 md:gap-y-1 border-b border-border pb-6 last:border-0 last:pb-0">
      <dt className="text-xs font-mono text-muted-foreground md:pt-1 md:whitespace-nowrap">
        {label}
      </dt>
      <dd className="text-foreground leading-relaxed text-sm sm:text-base">
        {body}
      </dd>
    </div>
  );
}
