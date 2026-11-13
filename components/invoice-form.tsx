"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type Line = { description: string; quantity: number; unitPriceUsd: number };

export function InvoiceForm() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unitPriceUsd: 0 },
  ]);
  const [pending, start] = useTransition();
  const router = useRouter();

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPriceUsd, 0);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeLine(i: number) {
    setLines((rows) => (rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i)));
  }

  function addLine() {
    setLines((rows) => [...rows, { description: "", quantity: 1, unitPriceUsd: 0 }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return toast.error("Client name required");
    if (total <= 0) return toast.error("Line items must total more than $0");
    if (!dueDate) return toast.error("Due date required");

    start(async () => {
      const res = await fetch("/api/invoices", {
        method: "POST",
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
        toast.error(data.error ?? "Could not create invoice");
        return;
      }
      toast.success("Invoice created");
      router.push(`/app/invoices/${data.invoice.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input
              id="clientName"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Co"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client email (optional)</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="billing@acme.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="memo">Memo (optional)</Label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="October design work"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Label>Line items</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addLine}>
            + Add line
          </Button>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-7"
                placeholder="Description"
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min={1}
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) =>
                  updateLine(i, { quantity: Math.max(1, Number(e.target.value || 0)) })
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
                  updateLine(i, { unitPriceUsd: Number(e.target.value || 0) })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="col-span-1"
                onClick={() => removeLine(i)}
                aria-label="Remove line"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end items-center gap-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-semibold font-mono">
            ${total.toFixed(2)}
          </span>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
