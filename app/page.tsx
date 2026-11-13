import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroCommand } from "@/components/hero-command";

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto max-w-6xl flex items-center justify-between px-6 py-6">
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
      <section className="mx-auto max-w-6xl px-6 pt-16 md:pt-28 pb-10 md:pb-16">
        <div className="max-w-5xl">
          <div className="text-xs font-mono text-muted-foreground">
            Built for NEAR HACKATHON · Real-World Money
          </div>
          <h1 className="heading-tight mt-10 text-6xl md:text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.95]">
            Invoicing that routes payments across chains,
            <span className="text-primary"> not across weeks.</span>
          </h1>
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

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <h2 className="heading-tight text-4xl md:text-6xl leading-[1.02]">
              Invoice an overseas client in the next two minutes.
            </h2>
            <div className="mt-10 flex items-center gap-5">
              <Button asChild size="lg">
                <Link href="/app">Create your first invoice</Link>
              </Button>
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

function FlowDiagram() {
  const chains = [
    { label: "Ethereum", note: "USDC" },
    { label: "Arbitrum", note: "USDC" },
    { label: "Base", note: "USDC" },
    { label: "Solana", note: "USDC" },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-6 md:p-10">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-center text-sm">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">
            Client pays from
          </div>
          <ul className="space-y-2">
            {chains.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between border border-border rounded px-3 py-2.5 bg-background/40"
              >
                <span>{c.label}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {c.note}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            via
          </div>
          <div className="h-16 w-16 rounded-full border border-primary/40 bg-primary/5 flex items-center justify-center">
            <span className="font-mono text-xs text-primary tracking-tight">
              intents
            </span>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            ~2 min
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">
            Freelancer receives
          </div>
          <div className="border border-primary/50 bg-primary/5 rounded px-3 py-2.5 flex items-center justify-between">
            <span className="font-medium">USDC on NEAR</span>
            <span className="text-xs font-mono text-primary">settled</span>
          </div>
          <div className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Zero gas purchased. Zero bridge UI. The freelancer&apos;s wallet
            balance just goes up.
          </div>
        </div>
      </div>
    </div>
  );
}
