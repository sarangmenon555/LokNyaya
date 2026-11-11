import type { Forum } from "./schema";

export function routeForums(forums: Forum[], claimValue?: number): Forum[] {
  if (claimValue === undefined) return forums;
  return forums.filter(
    (f) => claimValue > f.minExclusive && (f.maxInclusive === null || claimValue <= f.maxInclusive)
  );
}
