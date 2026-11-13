// Browser-side mic capture via MediaRecorder. Works everywhere:
// Chrome, Edge, Safari (iOS/macOS), Firefox, Chromium. No Google Speech
// dependency - audio is streamed to our own /api/transcribe route which
// calls NEAR AI's Whisper endpoint.

export type Recorder = {
  stop: () => Promise<Blob>;
};

export function isRecordAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

// Pick a mime type supported by this browser. Order matters - the first one
// MediaRecorder.isTypeSupported accepts wins. Whisper accepts webm/opus and
// mp4/m4a natively, so we stay in that family.
function pickMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "";
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
      sampleRate: 16000,
    },
  });

  const mime = pickMime();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  rec.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, {
            type: mime || "audio/webm",
          });
          resolve(blob);
        };
        rec.stop();
      }),
  };
}
