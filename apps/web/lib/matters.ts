import { jurisdictions, registry } from "@loknyaya/engine/bundled";

type Pack = (typeof registry.packs)[number];

export interface MatterOption {
  key: string;
  pack: Pack;
  rule: Pack["rules"][number];
}

export const sortedJurisdictions = [...jurisdictions].sort((a, b) => a.name.localeCompare(b.name));

export function whereOf(codes: string[]): string {
  return codes.map((c) => jurisdictions.find((j) => j.code === c)?.name ?? c).join(", ");
}

export function optionsFor(stateCode: string): MatterOption[] {
  const packs = stateCode ? registry.packsFor(stateCode) : registry.packs.filter((p) => p.layer === "central");
  return packs.flatMap((pack) => pack.rules.map((rule) => ({ key: `${pack.id}/${rule.id}`, pack, rule })));
}
