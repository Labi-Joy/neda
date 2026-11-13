import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { InvoiceForm } from "@/components/invoice-form";
import type { LineItem } from "@/lib/types";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const nearId = await getCurrentNearId();
  if (!nearId) return null;

  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.ownerNearId !== nearId) notFound();
  if (invoice.status === "paid") {
    // Paid invoices are immutable; send the user back to the detail view.
    notFound();
  }

  const lineItems: LineItem[] = JSON.parse(invoice.lineItems);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="space-y-2">
        <Link
          href={`/app/invoices/${invoice.id}`}
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          ← Back to invoice
        </Link>
        <h1 className="heading-tight text-3xl md:text-4xl">Edit invoice</h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Fix typos, change amounts, or update the client. Changing the
          amount or due date regenerates the payment addresses, so the client
          sees the corrected total automatically on the public link.
        </p>
      </div>

      <InvoiceForm
        initial={{
          id: invoice.id,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          dueDate: invoice.dueDate.toISOString(),
          memo: invoice.memo,
          lineItems,
        }}
        onCancelHref={`/app/invoices/${invoice.id}`}
      />
    </div>
  );
}
