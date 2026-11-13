"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function InvoiceStatusWatcher({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "paid") return;

    const tick = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/sync`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (data?.invoice?.status === "paid") {
          router.refresh();
          if (timer.current) clearInterval(timer.current);
        }
      } catch {
        // ignore transient failures
      }
    };

    tick();
    timer.current = setInterval(tick, 10_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [invoiceId, status, router]);

  return null;
}
