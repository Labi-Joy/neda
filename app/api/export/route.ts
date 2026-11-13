import { db } from "@/lib/db";
import { getCurrentNearId } from "@/lib/auth";
import { invoicesToCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const nearId = await getCurrentNearId();
  if (!nearId) return new Response("unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const invoices = await db.invoice.findMany({
    where: {
      ownerNearId: nearId,
      status: "paid",
      ...(from ? { paidAt: { gte: new Date(from) } } : {}),
      ...(to ? { paidAt: { lte: new Date(to) } } : {}),
    },
    orderBy: { paidAt: "desc" },
  });

  const csv = invoicesToCsv(invoices);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="neda-invoices-${today}.csv"`,
    },
  });
}
