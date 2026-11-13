import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroCommand } from "@/components/hero-command";
import { HeroHeadline } from "@/components/hero-headline";
import { FlowDiagram } from "@/components/flow-diagram";
import { CtaSuccess } from "@/components/cta-success";
import { HeroBackground } from "@/components/hero-background";

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="relative z-20 mx-auto max-w-6xl flex items-center justify-between px-6 py-6">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          neda
        </Link>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/Labi-Joy/neda"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1"
          >
            github
          </a>
          <Button asChild size="sm">
            <Link href="/app">Launch app</Link>
          </Button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <HeroBackground />
        {/* Soft gradient scrim so text stays legible over the particle field */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklch, var(--background) 20%, transparent) 0%, color-mix(in oklch, var(--background) 70%, transparent) 60%, var(--background) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-10 md:pt-24 pb-10 md:pb-16">
          <div className="max-w-5xl">
            <div className="text-xs font-mono text-muted-foreground">
              Built for NEAR HACKATHON · Real-World Money
            </div>
            <div className="mt-10">
              <HeroHeadline />
            </div>
            <p className="mt-10 text-lg md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
              Your US client pays USDC on Ethereum. You get USDC on NEAR.
              Two minutes, no bridge, no gas, no bank.
            </p>
            <div className="mt-12 flex items-center gap-6">
              <Button asChild size="lg">
                <Link href="/app">Create your first invoice</Link>
              </Button>
              <a
                href="#how"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                See the flow
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COMMAND BAR DEMO BAND */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-5">
            <div className="text-xs font-mono text-muted-foreground">
              The command bar
            </div>
            <h2 className="heading-tight mt-3 text-2xl md:text-3xl leading-[1.1]">
              Talk to your books in plain English.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              NEDA means <em>voice</em> in Persian. We named it that because you
              can just talk to it. Powered by NEAR AI.
            </p>
          </div>
          <div className="md:col-span-7">
            <HeroCommand />
          </div>
        </div>
      </section>

      {/* MONEY FLOW */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                The flow
              </div>
              <h2 className="heading-tight mt-4 text-4xl md:text-5xl leading-[1.02]">
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
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                Why NEAR specifically
              </div>
              <h2 className="heading-tight mt-4 text-4xl md:text-5xl leading-[1.02]">
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

      {/* SUSTAINABILITY — why this matters, who it is for, how it endures */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="text-xs font-mono text-muted-foreground">
                Why this lasts
              </div>
              <h2 className="heading-tight mt-4 text-4xl md:text-5xl leading-[1.02]">
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
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <h2 className="heading-tight text-4xl md:text-6xl leading-[1.02]">
              Invoice an overseas client in the next two minutes.
            </h2>
            <div className="mt-10 flex items-center gap-5">
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

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <div>neda / 2026 / built at NEAR HACKATHON</div>
          <div className="flex gap-5">
            <a
              href="https://github.com/Labi-Joy/neda"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              github
            </a>
            <a
              href="https://docs.near-intents.org/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              near intents
            </a>
            <a
              href="https://near.ai/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              near ai
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function WhyRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-b border-border pb-6 last:border-0 last:pb-0">
      <dt className="text-xs font-mono text-muted-foreground pt-1 whitespace-nowrap">
        {label}
      </dt>
      <dd className="text-foreground leading-relaxed">{body}</dd>
    </div>
  );
}
