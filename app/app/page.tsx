import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandBar } from "@/components/command-bar";

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function statusTone(s: string): "default" | "secondary" | "destructive" | "outline" {
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
    .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= thisMonthStart)
    .reduce((s, i) => s + (i.receivedAmount ?? i.amountUsd), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      <CommandBar nearId={nearId} />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Gross earned" value={formatUsd(grossEarned)} tone="emerald" />
        <StatCard label="This month" value={formatUsd(monthGross)} />
        <StatCard label="Pending" value={formatUsd(pending)} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Invoices</h2>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/api/export">Export CSV</a>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/invoices/new">New invoice</Link>
            </Button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge variant={statusTone(inv.status)} className="capitalize">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{inv.clientName}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatUsd(inv.amountUsd)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.dueDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/invoices/${inv.id}`}
                        className="text-sm underline underline-offset-2 hover:text-foreground"
                      >
                        Open
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
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald";
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="text-xs uppercase text-muted-foreground tracking-wide">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold ${tone === "emerald" ? "text-emerald-600 dark:text-emerald-500" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h3 className="text-base font-medium">No invoices yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first invoice, or ask the Command Bar above.
      </p>
      <Button asChild className="mt-4">
        <Link href="/app/invoices/new">New invoice</Link>
      </Button>
    </div>
  );
}
