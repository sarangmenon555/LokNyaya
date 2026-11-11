export function sendEvent(payload: Record<string, unknown>): void {
  if (typeof navigator === "undefined" || navigator.doNotTrack === "1") return;
  try {
    void fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => undefined);
  } catch {}
}
