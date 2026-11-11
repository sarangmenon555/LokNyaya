import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { computeLimitation } from "../src/limitation";
import { loadJurisdictions, loadPacks } from "../src/node";
import { buildRegistry } from "../src/registry";

const dir = fileURLToPath(new URL("../../../packs", import.meta.url));
const packs = loadPacks(dir);
const registry = buildRegistry(packs);
const jurisdictions = loadJurisdictions(dir);

describe("packs", () => {
  it("loads and validates every pack", () => {
    expect(packs.length).toBeGreaterThanOrEqual(3);
  });

  it("applies central packs to every jurisdiction", () => {
    const central = packs.filter((p) => p.layer === "central").length;
    for (const j of jurisdictions) expect(registry.packsFor(j.code).length).toBeGreaterThanOrEqual(central);
  });

  it("finds a rule by id", () => {
    expect(registry.findRule("consumer-protection-act-2019", "goods-or-service")).toBeDefined();
    expect(registry.findRule("consumer-protection-act-2019", "missing")).toBeUndefined();
  });

  it("rejects duplicate pack ids", () => {
    const first = packs[0];
    if (!first) throw new Error("no packs");
    expect(() => buildRegistry([first, first])).toThrow();
  });

  const goldens = packs.flatMap((p) =>
    p.rules.flatMap((r) => r.golden.map((g) => ({ label: `${p.id}/${r.id}/${g.name}`, spec: r.limitation, g })))
  );

  it.each(goldens)("golden case $label", ({ spec, g }) => {
    const out = computeLimitation(spec, g.input);
    expect(out.deadline).toBe(g.expect.deadline);
    expect(out.status).toBe(g.expect.status);
  });
});

describe("jurisdictions", () => {
  it("covers 28 states and 8 union territories with unique codes", () => {
    expect(jurisdictions.length).toBe(36);
    expect(new Set(jurisdictions.map((j) => j.code)).size).toBe(36);
    expect(jurisdictions.filter((j) => j.type === "state").length).toBe(28);
    expect(jurisdictions.filter((j) => j.type === "ut").length).toBe(8);
  });
});

describe("state packs", () => {
  const ids = (code: string) => registry.packsFor(code).map((p) => p.id);

  it("appear only for their own jurisdiction", () => {
    expect(ids("TN")).toContain("tn-tenancy-2017");
    expect(ids("KL")).not.toContain("tn-tenancy-2017");
    expect(ids("KL")).toContain("kl-tenancy");
    expect(ids("WB")).not.toContain("kl-tenancy");
  });
});
