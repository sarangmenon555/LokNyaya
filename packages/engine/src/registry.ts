import type { Pack, Rule } from "./schema";

export interface Registry {
  packs: Pack[];
  findRule(packId: string, ruleId: string): { pack: Pack; rule: Rule } | undefined;
  packsFor(jurisdictionCode: string): Pack[];
}

export function buildRegistry(packs: Pack[]): Registry {
  const packIds = new Set<string>();
  for (const pack of packs) {
    if (packIds.has(pack.id)) throw new Error(`Duplicate pack id: ${pack.id}`);
    packIds.add(pack.id);
    const ruleIds = new Set<string>();
    for (const rule of pack.rules) {
      if (ruleIds.has(rule.id)) throw new Error(`Duplicate rule id: ${pack.id}/${rule.id}`);
      ruleIds.add(rule.id);
    }
  }
  return {
    packs,
    findRule(packId, ruleId) {
      const pack = packs.find((p) => p.id === packId);
      const rule = pack?.rules.find((r) => r.id === ruleId);
      return pack && rule ? { pack, rule } : undefined;
    },
    packsFor(code) {
      return packs.filter((p) => p.layer === "central" || p.jurisdictions.includes(code));
    }
  };
}
