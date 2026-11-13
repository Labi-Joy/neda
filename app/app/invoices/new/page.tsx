import Link from "next/link";
import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="space-y-2">
        <Link
          href="/app"
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          ← Back to invoices
        </Link>
        <h1 className="heading-tight text-3xl md:text-4xl">New invoice</h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Fill in the details. We&apos;ll generate a payment link your client
          can open and pay from any chain, and route the settlement to your
          NEAR account in USDC.
        </p>
      </div>

      <InvoiceForm />
    </div>
  );
}
