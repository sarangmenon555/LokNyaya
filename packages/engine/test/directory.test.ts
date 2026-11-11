import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { loadDirectory, loadJurisdictions } from "../src/node";

const dir = fileURLToPath(new URL("../../../packs", import.meta.url));

it("only lists known jurisdiction codes", () => {
  const codes = new Set(loadJurisdictions(dir).map((j) => j.code));
  for (const code of Object.keys(loadDirectory(dir))) expect(codes.has(code)).toBe(true);
});
