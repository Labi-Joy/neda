"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isSpeechAvailable, startDictation } from "@/lib/speech";

const EXAMPLES = [
  "create invoice for Acme Co $500 due Nov 30",
  "show unpaid invoices",
  "export last month as csv",
];

export function CommandBar({ nearId }: { nearId: string }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [reply, setReply] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const stopDictationRef = useRef<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSpeechAvailable(isSpeechAvailable());
    return () => {
      stopDictationRef.current?.();
    };
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

  function toggleMic() {
    if (listening) {
      stopDictationRef.current?.();
      stopDictationRef.current = null;
      setListening(false);
      return;
    }

    const stop = startDictation({
      onInterim: (text) => setValue(text),
      onFinal: (text) => {
        setValue(text);
        setListening(false);
        stopDictationRef.current = null;
        // Auto-run on final transcription so it feels like a real voice command
        run(text);
      },
      onError: (err) => {
        toast.error(
          err === "not-allowed"
            ? "Microphone access was blocked. Enable it in your browser settings."
            : `Voice input error: ${err}`,
        );
        setListening(false);
        stopDictationRef.current = null;
      },
      onEnd: () => {
        setListening(false);
        stopDictationRef.current = null;
      },
    });

    if (stop) {
      stopDictationRef.current = stop;
      setListening(true);
    } else {
      toast.error("Voice input is not available in this browser");
    }
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              listening ? "bg-primary animate-pulse" : "bg-primary/60"
            }`}
          />
          <span>
            {listening
              ? "listening…"
              : pending
                ? "running…"
                : "command bar — neda ai"}
          </span>
        </div>
        <span className="hidden sm:inline">type · speak · paste</span>
      </div>
      <form
        onSubmit={submit}
        className="flex items-center gap-3 px-5 py-4 font-mono text-[15px] md:text-base"
      >
        <span className="text-primary select-none">&gt;</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            listening
              ? "Listening — speak now"
              : "create invoice for Acme Co $500 due Nov 30"
          }
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
          disabled={pending || listening}
          aria-label="Command bar input"
        />

        {speechAvailable && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={pending}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md border transition-colors disabled:opacity-40 ${
              listening
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            {listening ? <StopIcon /> : <MicIcon />}
            {listening && (
              <span className="absolute inline-flex h-8 w-8 rounded-md bg-primary/20 animate-ping" />
            )}
          </button>
        )}

        <button
          type="submit"
          disabled={pending || listening || !value.trim()}
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
      {!reply && !pending && !value && !listening && (
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
