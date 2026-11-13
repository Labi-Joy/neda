"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineButton } from "@/components/shine-button";
import { Spinner } from "@/components/page-loader";
import { toast } from "sonner";

// 1Click makes 4 parallel chain quotes, which usually resolves in 2-4s but
// can take longer at mainnet peak. Walk the user through what's happening
// so the button does not feel frozen.
const PROGRESS_STEPS = [
  "Saving invoice",
  "Requesting chain quotes from NEAR Intents",
  "Generating per-chain deposit addresses",
  "Preparing payment link",
];

type Line = { description: string; quantity: number; unitPriceUsd: number };

export type InvoiceFormInitial = {
  id?: string;
  clientName?: string;
  clientEmail?: string | null;
  dueDate?: string; // ISO
  memo?: string | null;
  lineItems?: Line[];
};

export function InvoiceForm({
  initial,
  onCancelHref,
}: {
  initial?: InvoiceFormInitial;
  onCancelHref?: string;
} = {}) {
  const editMode = Boolean(initial?.id);
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [dueDate, setDueDate] = useState(() => {
    if (initial?.dueDate) return new Date(initial.dueDate).toISOString().slice(0, 10);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.lineItems && initial.lineItems.length > 0
      ? initial.lineItems
      : [{ description: "", quantity: 1, unitPriceUsd: 0 }],
  );
  const [pending, start] = useTransition();
  const [progressStep, setProgressStep] = useState(0);
  const router = useRouter();

  // While pending, advance the progress label every ~1.1s so the user sees
  // movement. If the request finishes before the last label, we land on
  // success before confusing them.
  useEffect(() => {
    if (!pending) {
      setProgressStep(0);
      return;
    }
    const t = setInterval(() => {
      setProgressStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 1100);
    return () => clearInterval(t);
  }, [pending]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPriceUsd, 0);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  function removeLine(i: number) {
    setLines((rows) =>
      rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i),
    );
  }

  function addLine() {
    setLines((rows) => [
      ...rows,
      { description: "", quantity: 1, unitPriceUsd: 0 },
    ]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return toast.error("Client name required");
    if (total <= 0) return toast.error("Line items must total more than $0");
    if (!dueDate) return toast.error("Due date required");

    start(async () => {
      const url = editMode ? `/api/invoices/${initial!.id}` : "/api/invoices";
      const method = editMode ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          dueDate: new Date(dueDate).toISOString(),
          memo: memo.trim() || undefined,
          amountUsd: total,
          lineItems: lines.filter((l) => l.description.trim() !== ""),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save invoice");
        return;
      }
      toast.success(editMode ? "Invoice updated" : "Invoice created");
      router.push(`/app/invoices/${data.invoice.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="text-xs font-mono text-muted-foreground mb-5">
          Client
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="clientName">Name</Label>
            <Input
              id="clientName"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Co"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail" className="text-muted-foreground">
              Email <span className="text-xs">(optional)</span>
            </Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="billing@acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-muted-foreground">
              Memo <span className="text-xs">(optional)</span>
            </Label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="October design work"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="text-xs font-mono text-muted-foreground">
            Line items
          </div>
          <button
            type="button"
            onClick={addLine}
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            + add line
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <Input
                className="col-span-7"
                placeholder="Description"
                value={line.description}
                onChange={(e) =>
                  updateLine(i, { description: e.target.value })
                }
              />
              <Input
                className="col-span-2"
                type="number"
                min={1}
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(i, {
                    quantity: Math.max(1, Number(e.target.value || 0)),
                  })
                }
              />
              <Input
                className="col-span-2"
                type="number"
                min={0}
                step="0.01"
                placeholder="Price"
                value={line.unitPriceUsd || ""}
                onChange={(e) =>
                  updateLine(i, {
                    unitPriceUsd: Number(e.target.value || 0),
                  })
                }
              />
              <button
                type="button"
                className="col-span-1 text-muted-foreground hover:text-destructive text-sm"
                onClick={() => removeLine(i)}
                aria-label="Remove line"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-5 border-t border-border flex items-baseline justify-between">
          <span className="text-sm font-mono text-muted-foreground">Total</span>
          <span className="text-3xl font-mono">${total.toFixed(2)}</span>
        </div>
      </section>

      <div className="flex justify-end gap-4 items-center">
        {pending && (
          <div
            className="flex items-center gap-2 text-sm font-mono text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Spinner />
            <span>{PROGRESS_STEPS[progressStep]}…</span>
          </div>
        )}
        {!pending && (
          <button
            type="button"
            onClick={() =>
              onCancelHref ? router.push(onCancelHref) : history.back()
            }
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <ShineButton type="submit" size="lg" disabled={pending}>
          {pending
            ? editMode
              ? "Saving changes"
              : "Creating invoice"
            : editMode
              ? "Save changes"
              : "Create invoice"}
        </ShineButton>
      </div>
    </form>
  );
}
