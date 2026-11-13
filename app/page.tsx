import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          neda
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/Labi-Joy/neda"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            GitHub
          </a>
          <Button asChild size="sm">
            <Link href="/app">Launch App</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Built at NEAR HACKATHON · Real-World Money track
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Get paid in USDC from anywhere.
            <br />
            <span className="text-muted-foreground">
              No wallet. No gas. No bank.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Freelancers in Lagos, Nairobi, Accra lose 15-20% of their income to
            banking delays, FX spreads, and 6-8% fees. Neda is the invoicing
            platform where your US client pays from the chain they already use,
            and you receive USDC on NEAR. Settles in minutes.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg">
              <Link href="/app">Launch App</Link>
            </Button>
            <a
              href="#how"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See how it works →
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Three steps. No crypto knowledge required.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "Create an invoice",
                body:
                  "Type the client, amount, and due date. Or ask the AI Command Bar: ‘invoice Acme Co $500 net-30’.",
              },
              {
                n: "02",
                title: "Client pays from anywhere",
                body:
                  "Share one link. Your client pays from MetaMask, Phantom, or any wallet, on any chain. ETH, SOL, BTC, Base — all accepted.",
              },
              {
                n: "03",
                title: "You receive USDC on NEAR",
                body:
                  "NEAR Intents routes it automatically. You never signed a transaction, never bought gas, never installed a wallet.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="text-xs text-muted-foreground font-mono">
                  {s.n}
                </div>
                <h3 className="mt-3 text-lg font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-xs text-muted-foreground font-mono">
              THE AI LAYER
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Talk to your books.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Open the dashboard. The Command Bar listens. Create invoices, pull
              reports, export CSVs for your accountant — all in plain English.
              No forms unless you want them.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-6 font-mono text-sm space-y-3">
            <div className="text-muted-foreground">
              &gt; create invoice for Acme Co $500 due Nov 30
            </div>
            <div>✓ Invoice INV-0042 created. Link copied.</div>
            <div className="text-muted-foreground">
              &gt; show unpaid invoices from October
            </div>
            <div>✓ 3 invoices · $1,850 outstanding</div>
            <div className="text-muted-foreground">
              &gt; export last quarter as CSV
            </div>
            <div>✓ 24 invoices · neda-q3.csv</div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                Built on NEAR Intents.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl">
                Intents is NEAR&apos;s cross-chain settlement layer. One deposit
                address per invoice, 50+ chains accepted, zero gas for the
                freelancer. This product is only possible here — the primitive
                does not exist elsewhere.
              </p>
            </div>
            <div className="flex md:items-end">
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link href="/app">Launch App →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <div>Neda · Built at NEAR HACKATHON 2026</div>
          <div className="flex gap-6">
            <a
              href="https://github.com/Labi-Joy/neda"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://docs.near-intents.org/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              NEAR Intents
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
