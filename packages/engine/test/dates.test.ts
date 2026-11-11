import { describe, expect, it } from "vitest";
import { addMonths, diffDays, parseISO, toISO } from "../src/dates";

describe("dates", () => {
  it("rejects impossible dates", () => {
    expect(() => parseISO("2023-02-30")).toThrow();
    expect(() => parseISO("12-01-2023")).toThrow();
  });

  it("clamps to the end of a shorter month", () => {
    expect(toISO(addMonths(parseISO("2024-01-31"), 1))).toBe("2024-02-29");
    expect(toISO(addMonths(parseISO("2024-02-29"), 12))).toBe("2025-02-28");
  });

  it("counts days between dates", () => {
    expect(diffDays(parseISO("2026-02-20"), parseISO("2026-03-12"))).toBe(20);
  });
});
