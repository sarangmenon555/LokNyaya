import type { ConcordanceEntry } from "./schema";

const NOISE = /\b(section|sec|u\/s|ipc|crpc|bnss|bns|bsa|evidence act)\b/g;

export function findSections(entries: ConcordanceEntry[], query: string): ConcordanceEntry[] {
  const q = query.toLowerCase().replace(NOISE, " ").replace(/\s+/g, " ").trim();
  if (!q) return [];
  return entries.filter(
    (e) =>
      e.newSections.some((s) => s.toLowerCase() === q) ||
      e.oldSections.some((s) => s.toLowerCase() === q) ||
      (q.length >= 3 && e.topic.toLowerCase().includes(q))
  );
}
