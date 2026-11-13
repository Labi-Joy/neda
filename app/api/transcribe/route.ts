import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

// Server-side Whisper via NEAR AI (openai/whisper-large-v3, OpenAI-compatible).
// Accepts a multipart POST with an "audio" field. Returns { text }.
// Uses NEAR AI's OpenAI-compatible endpoint so we stay on one credit balance.

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const nearId = await readSession();
  if (!nearId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.NEAR_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "transcription not configured" }, { status: 500 });
  }

  const base = process.env.NEAR_AI_BASE_URL || "https://cloud-api.near.ai/v1";

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "missing audio" }, { status: 400 });
  }

  // Cap at ~10MB so we do not blow through credits on long uploads.
  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "audio too large" }, { status: 413 });
  }

  // Forward as multipart to NEAR AI's /audio/transcriptions.
  const upstream = new FormData();
  upstream.append(
    "file",
    audio,
    (audio as Blob & { name?: string }).name || "voice.webm",
  );
  upstream.append("model", "openai/whisper-large-v3");
  upstream.append("response_format", "json");

  try {
    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstream,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("whisper upstream failed:", res.status, text);
      return NextResponse.json(
        { error: "transcription failed", details: text.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { text?: string };
    const text = (data.text || "").trim();
    if (!text) {
      return NextResponse.json({ text: "", warn: "empty transcript" });
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("whisper error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "transcribe crashed" },
      { status: 500 },
    );
  }
}
