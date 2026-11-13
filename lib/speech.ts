// Minimal client-only wrapper around the browser Web Speech API.
// Works in Chromium (prefix free) and WebKit (webkitSpeechRecognition).

// Vendor-specific types that TypeScript's lib.dom does not fully model yet.
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
}
interface SpeechRecognitionEvent {
  results: ArrayLike<SpeechRecognitionResult>;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: Ctor;
    webkitSpeechRecognition?: Ctor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechAvailable(): boolean {
  return getCtor() !== null;
}

export type SpeechListener = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
};

export function startDictation(listener: SpeechListener): (() => void) | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-US";

  rec.onresult = (e) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const text = r[0].transcript;
      if (r.isFinal) final += text;
      else interim += text;
    }
    if (final) listener.onFinal(final.trim());
    else if (interim) listener.onInterim(interim.trim());
  };
  rec.onerror = (e) => listener.onError(e.error || "unknown");
  rec.onend = () => listener.onEnd();

  try {
    rec.start();
  } catch (err) {
    listener.onError(err instanceof Error ? err.message : "start failed");
    return null;
  }

  return () => {
    try {
      rec.stop();
    } catch {
      // ignore
    }
  };
}
