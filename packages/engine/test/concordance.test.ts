import { describe, expect, it } from "vitest";
import { concordance } from "../src/bundled";
import { findSections } from "../src/concordance";

const ids = (query: string) => findSections(concordance.entries, query).map((e) => e.id);

describe("findSections", () => {
  it("finds the new section from an old section number", () => {
    expect(ids("420")).toEqual(["bns-318"]);
    expect(ids("IPC 420")).toEqual(["bns-318"]);
    expect(ids("section 65b")).toEqual(["bsa-63"]);
    expect(ids("125")).toEqual(["bnss-144"]);
  });

  it("finds the old section from a new section number", () => {
    expect(ids("BNS 318(4)")).toEqual(["bns-318"]);
    expect(ids("63")).toEqual(["bsa-63"]);
  });

  it("returns both meanings when a number is used in the old and new codes", () => {
    expect(ids("144").sort()).toEqual(["bnss-144", "bnss-163"]);
  });

  it("matches topic words and ignores empty or unknown queries", () => {
    expect(ids("defamation")).toEqual(["bns-356"]);
    expect(ids("")).toEqual([]);
    expect(ids("zzzz")).toEqual([]);
  });
});
