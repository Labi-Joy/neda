import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { CommandBar } from "@/components/command-bar";
import { ShineButton } from "@/components/shine-button";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function statusTone(
  s: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function DashboardPage() {
  const nearId = await getCurrentNearId();
  if (!nearId) return null;

  const invoices = await db.invoice.findMany({
    where: { ownerNearId: nearId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const grossEarned = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.receivedAmount ?? i.amountUsd), 0);
  const pending = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + i.amountUsd, 0);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const monthGross = invoices
    .filter(
      (i) => i.status === "paid" && i.paidAt && i.paidAt >= thisMonthStart,
    )
    .reduce((s, i) => s + (i.receivedAmount ?? i.amountUsd), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <div className="space-y-2">
        <div className="text-xs font-mono text-muted-foreground">
          Signed in as <span className="text-foreground">{nearId}</span>
        </div>
        <h1 className="heading-tight text-3xl md:text-4xl">Invoices</h1>
      </div>

      <CommandBar nearId={nearId} />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Gross earned"
          value={formatUsd(grossEarned)}
          accent="emerald"
        />
        <StatCard label="This month" value={formatUsd(monthGross)} />
        <StatCard label="Pending" value={formatUsd(pending)} accent="primary" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-mono text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </h2>
          <div className="flex gap-2">
            <a
              href="/api/export"
              className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors"
            >
              Export CSV
            </a>
            <ShineButton href="/app/invoices/new" size="sm">
              New invoice
            </ShineButton>
          </div>
        </div>

        {invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-muted-foreground text-xs font-mono">
                <tr>
                  <th className="text-left px-5 py-3 font-normal">Status</th>
                  <th className="text-left px-5 py-3 font-normal">Client</th>
                  <th className="text-right px-5 py-3 font-normal">Amount</th>
                  <th className="text-left px-5 py-3 font-normal">Due</th>
                  <th className="text-left px-5 py-3 font-normal">Created</th>
                  <th className="text-right px-5 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-border hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Badge
                        variant={statusTone(inv.status)}
                        className="capitalize font-mono text-xs"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-medium">{inv.clientName}</td>
                    <td className="px-5 py-4 text-right font-mono">
                      {formatUsd(inv.amountUsd)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                      {inv.dueDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                      {inv.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/app/invoices/${inv.id}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "primary";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-500"
      : accent === "primary"
        ? "text-primary"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="text-xs font-mono text-muted-foreground">{label}</div>
      <div className={`mt-3 text-3xl font-mono ${color}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <h3 className="text-base font-medium">No invoices yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Create your first invoice from the form, or just ask the Command Bar
        above: <em>invoice Acme $500 net-30</em>.
      </p>
      <div className="mt-6 inline-flex">
        <ShineButton href="/app/invoices/new" size="md">
          Create your first invoice
        </ShineButton>
      </div>
    </div>
  );
}
