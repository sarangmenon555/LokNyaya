import type { Pack, Rule } from "./schema";

export type LawLevel = "central" | "state" | "ut";

export interface Law {
  name: string;
  title: string;
  year: string | null;
  level: LawLevel;
  jurisdictions: string[];
  setsDeadline: boolean;
  provision: string | null;
}

export function splitActName(name: string): { title: string; year: string | null } {
  const match = /^(.*?),?\s+(\d{4})$/.exec(name.trim());
  if (!match) return { title: name.trim(), year: null };
  return { title: (match[1] ?? name).trim(), year: match[2] ?? null };
}

function provisionOf(source: string, name: string): string | null {
  const index = source.indexOf(name);
  if (index < 0) return null;
  const rest = source.slice(index + name.length).replace(/^[,\s]+/, "");
  const cut = rest.search(/ \(|\. /);
  const text = (cut >= 0 ? rest.slice(0, cut) : rest).replace(/[.,\s]+$/, "");
  return text.length > 0 ? text : null;
}

export function lawsFor(pack: Pack, rule: Rule): Law[] {
  const source = rule.limitation.source;
  const laws = pack.acts.map((name): Law => {
    const { title, year } = splitActName(name);
    const local = pack.stateActs.includes(name);
    return {
      name,
      title,
      year,
      level: local ? (pack.layer === "ut" ? "ut" : "state") : "central",
      jurisdictions: local ? pack.jurisdictions : [],
      setsDeadline: source.includes(name),
      provision: provisionOf(source, name)
    };
  });
  const rank = (law: Law) => (law.level === "central" ? 1 : 0);
  return [...laws].sort((a, b) => Number(b.setsDeadline) - Number(a.setsDeadline) || rank(a) - rank(b));
}
