import { getCurrentNearId } from "@/lib/auth";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const nearId = await getCurrentNearId();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card className="p-6 space-y-3">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">
          NEAR account
        </div>
        <div className="font-mono text-lg">{nearId}</div>
        <p className="text-sm text-muted-foreground">
          All invoice settlements route to this account as USDC on NEAR via
          Intents. To change the account, sign out and re-enter a different one.
        </p>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">
          Payout policy (coming soon)
        </div>
        <p className="text-sm text-muted-foreground">
          Split incoming payments into savings, spending, and yield pools on
          Rhea. Planned for v2.
        </p>
      </Card>
    </div>
  );
}
