export type AudioCaptureSession = {
  stop: () => void;
  done: Promise<Blob>;
};

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}

/** Record microphone audio until stopped or max duration (default 25s, under Sarvam's 30s cap). */
export function startAudioCapture(maxMs = 25_000): AudioCaptureSession {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  const startedAt = Date.now();
  const minMs = 1_500;

  const done = (async () => {
    if (typeof window === "undefined") {
      throw new Error("Web Speech API requires browser");
    }
    if (!window.isSecureContext) {
      throw new Error("not-secured");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("not-allowed");
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new Error("not-allowed");
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        throw new Error("audio-capture");
      }
      throw err;
    }

    const mimeType = pickMimeType();
    const chunks: BlobPart[] = [];

    return await new Promise<Blob>((resolve, reject) => {
      try {
        recorder = new MediaRecorder(stream!, { mimeType });
      } catch {
        stream!.getTracks().forEach((t) => t.stop());
        reject(new Error("audio-capture"));
        return;
      }

      const timeout = window.setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, maxMs);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = () => {
        window.clearTimeout(timeout);
        stream?.getTracks().forEach((t) => t.stop());
        reject(new Error("audio-capture"));
      };

      recorder.onstop = () => {
        window.clearTimeout(timeout);
        stream?.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) {
          reject(new Error("no-speech"));
          return;
        }
        const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
        if (blob.size < 2000) {
          reject(new Error("recording-too-short"));
          return;
        }
        resolve(blob);
      };

      recorder.start();
    });
  })();

  return {
    stop: () => {
      const wait = Math.max(0, minMs - (Date.now() - startedAt));
      window.setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, wait);
    },
    done,
  };
}
