import { addDays, parseISO, toISO } from "@loknyaya/engine";

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(parseISO(iso));
}

export interface CalendarEvent {
  date: string;
  title: string;
  description?: string;
  alarmDays: number;
}

export function buildIcs(events: CalendarEvent[]): string {
  const compact = (iso: string) => iso.replaceAll("-", "");
  const clean = (text: string) => text.replace(/[,;\\]/g, " ");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LokNyaya//Deadline//EN"];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${compact(event.date)}-${Math.random().toString(36).slice(2)}@loknyaya`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.date)}`,
      `DTEND;VALUE=DATE:${compact(toISO(addDays(parseISO(event.date), 1)))}`,
      `SUMMARY:${clean(event.title)}`
    );
    if (event.description) lines.push(`DESCRIPTION:${clean(event.description)}`);
    if (event.alarmDays > 0) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${clean(event.title)}`, `TRIGGER:-P${event.alarmDays}D`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, locale: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  window.speechSynthesis.speak(utterance);
}
