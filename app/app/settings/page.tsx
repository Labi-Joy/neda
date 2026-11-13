import { getCurrentNearId } from "@/lib/auth";

export default async function SettingsPage() {
  const nearId = await getCurrentNearId();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
      <div className="space-y-2">
        <div className="text-xs font-mono text-muted-foreground">Settings</div>
        <h1 className="heading-tight text-3xl md:text-4xl">Your account</h1>
      </div>

      <section className="rounded-lg border border-border bg-card p-8">
        <div className="text-xs font-mono text-muted-foreground">
          NEAR account
        </div>
        <div className="mt-2 font-mono text-2xl">{nearId}</div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-prose">
          All invoice settlements route to this account as USDC on NEAR via
          Intents. To change the account, sign out and re-enter a different one.
        </p>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-card p-8">
        <div className="text-xs font-mono text-muted-foreground">
          Payout policy
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-medium">Auto-split to yield (Rhea)</span>
          <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 border border-border rounded">
            planned
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-prose">
          Split incoming payments into savings, spending, and yield pools on
          Rhea Finance. Planned for v2.
        </p>
      </section>
    </div>
  );
}
