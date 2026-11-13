"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Mounts on the dashboard and background-syncs every pending invoice
// against 1Click. Refreshes the route tree the moment any invoice flips
// to paid so the dashboard reflects the new state without requiring the
// user to open individual invoices.
//
// Runs once on mount + every 15s while on the dashboard. Cheap: each
// pending invoice is one 1Click status call + one upsert.

export function DashboardSyncWatcher({
  invoiceIds,
}: {
  invoiceIds: string[];
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (invoiceIds.length === 0) return;

    const tick = async () => {
      let anyPaid = false;
      await Promise.all(
        invoiceIds.map(async (id) => {
          try {
            const res = await fetch(`/api/invoices/${id}/sync`, {
              method: "POST",
            });
            const data = await res.json().catch(() => ({}));
            if (data?.invoice?.status === "paid") anyPaid = true;
          } catch {
            // transient - try again next tick
          }
        }),
      );
      if (anyPaid) router.refresh();
    };

    tick();
    timer.current = setInterval(tick, 15_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [invoiceIds, router]);

  return null;
}
