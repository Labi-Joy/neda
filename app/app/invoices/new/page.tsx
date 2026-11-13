import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the details. We&apos;ll generate a payment link your client can
        open and pay from any chain.
      </p>
      <div className="mt-8">
        <InvoiceForm />
      </div>
    </div>
  );
}
