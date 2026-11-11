import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { directorySchema, jurisdictionSchema, packSchema } from "./schema";
import type { Directory, Jurisdiction, Pack } from "./schema";

export function loadPacks(dir: string): Pack[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "jurisdictions.json" && name !== "directory.json" && name !== "concordance.json")
    .sort()
    .map((name) => packSchema.parse(JSON.parse(readFileSync(join(dir, name), "utf8"))));
}

export function loadJurisdictions(dir: string): Jurisdiction[] {
  const raw = JSON.parse(readFileSync(join(dir, "jurisdictions.json"), "utf8"));
  return z.array(jurisdictionSchema).parse(raw);
}

export function loadDirectory(dir: string): Directory {
  return directorySchema.parse(JSON.parse(readFileSync(join(dir, "directory.json"), "utf8")));
}
