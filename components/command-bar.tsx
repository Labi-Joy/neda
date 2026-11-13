"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isRecordAvailable, startRecording, type Recorder } from "@/lib/record";

const EXAMPLES = [
  "create invoice for Acme Co $500 due Nov 30",
  "show unpaid invoices",
  "export last month as csv",
];

type VoiceState = "idle" | "recording" | "transcribing";

export function CommandBar({ nearId }: { nearId: string }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [reply, setReply] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const router = useRouter();

  useEffect(() => {
    setVoiceAvailable(isRecordAvailable());
  }, []);

  function run(message: string) {
    const msg = message.trim();
    if (!msg) return;
    start(async () => {
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, nearId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Command failed");
          return;
        }
        setReply(data.reply ?? "Done.");
        setValue("");
        if (data.refresh) router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(value);
  }

  async function toggleMic() {
    if (voice === "recording") {
      const rec = recorderRef.current;
      recorderRef.current = null;
      if (!rec) {
        setVoice("idle");
        return;
      }
      setVoice("transcribing");
      try {
        const blob = await rec.stop();
        if (blob.size < 500) {
          toast.error("Did not catch anything. Try again.");
          setVoice("idle");
          return;
        }
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? "Transcription failed");
          setVoice("idle");
          return;
        }
        const { text } = (await res.json()) as { text: string };
        if (!text.trim()) {
          toast.error("Did not catch anything. Try again.");
          setVoice("idle");
          return;
        }
        setValue(text);
        setVoice("idle");
        run(text);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Transcription crashed");
        setVoice("idle");
      }
      return;
    }

    try {
      const rec = await startRecording();
      recorderRef.current = rec;
      setVoice("recording");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("Microphone access was blocked. Enable it in browser settings.");
      } else {
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not access the microphone",
        );
      }
      setVoice("idle");
    }
  }

  const statusLabel =
    voice === "recording"
      ? "listening"
      : voice === "transcribing"
        ? "transcribing"
        : pending
          ? "running"
          : "command bar — neda ai";

  const disableInput = pending || voice !== "idle";

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          {voice === "recording" ? (
            <VoiceBars />
          ) : (
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                voice === "transcribing" || pending
                  ? "bg-primary animate-pulse"
                  : "bg-primary/60"
              }`}
            />
          )}
          <span>{statusLabel}</span>
        </div>
        <span className="hidden sm:inline">type · speak · paste</span>
      </div>
      <form
        onSubmit={submit}
        className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 font-mono text-[15px] md:text-base"
      >
        <span className="text-primary select-none">&gt;</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            voice === "recording"
              ? "Listening — speak now"
              : voice === "transcribing"
                ? "Transcribing with NEAR AI…"
                : "create invoice for Acme Co $500 due Nov 30"
          }
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60 min-w-0 text-base md:text-inherit"
          disabled={disableInput}
          aria-label="Command bar input"
        />

        {voiceAvailable && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={pending || voice === "transcribing"}
            aria-label={voice === "recording" ? "Stop recording" : "Start voice input"}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md border transition-colors disabled:opacity-40 ${
              voice === "recording"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {voice === "recording" ? <StopIcon /> : <MicIcon />}
          </button>
        )}

        <button
          type="submit"
          disabled={disableInput || !value.trim()}
          className="text-xs font-mono px-3 py-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "…" : "run ↵"}
        </button>
      </form>

      {reply && (
        <div className="px-5 pb-4 flex items-start gap-3 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
          <span className="text-primary select-none">✓</span>
          <span className="flex-1">{reply}</span>
        </div>
      )}
      {!reply && !pending && !value && voice === "idle" && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setValue(e)}
              className="text-xs font-mono px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceBars() {
  return (
    <span
      className="inline-flex items-end h-4 text-primary"
      aria-hidden="true"
    >
      <span className="voice-bar" />
      <span className="voice-bar" />
      <span className="voice-bar" />
      <span className="voice-bar" />
      <span className="voice-bar" />
    </span>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}
