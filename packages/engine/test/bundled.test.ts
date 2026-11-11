import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { jurisdictions, registry } from "../src/bundled";
import { loadJurisdictions, loadPacks } from "../src/node";

const dir = fileURLToPath(new URL("../../../packs", import.meta.url));

it("bundles every pack and jurisdiction on disk", () => {
  expect(registry.packs.map((p) => p.id).sort()).toEqual(loadPacks(dir).map((p) => p.id).sort());
  expect(jurisdictions.length).toBe(loadJurisdictions(dir).length);
});
