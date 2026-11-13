import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentNearId } from "@/lib/auth";
import { runAgent } from "@/lib/agent";

const schema = z.object({
  message: z.string().min(1).max(2000),
  nearId: z.string().optional(),
});

export async function POST(req: Request) {
  const nearId = await getCurrentNearId();
  if (!nearId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const outcome = await runAgent(nearId, parsed.data.message);
    return NextResponse.json(outcome);
  } catch (err) {
    console.error("agent error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "agent failed" },
      { status: 500 },
    );
  }
}

export const maxDuration = 30;
