import { describe, expect, it } from "vitest";
import { computeLimitation } from "../src/limitation";
import type { LimitationSpec } from "../src/schema";

const spec = (amount: number, unit: "days" | "months" | "years", extra: Partial<LimitationSpec> = {}): LimitationSpec => ({
  period: { amount, unit },
  starts: "the start event",
  source: "test",
  condonable: false,
  acknowledgementExtends: true,
  ...extra
});

describe("computeLimitation", () => {
  it("counts years from the start date", () => {
    const r = computeLimitation(spec(2, "years"), { start: "2024-03-12", today: "2025-12-01" });
    expect(r.deadline).toBe("2026-03-12");
    expect(r.daysRemaining).toBe(101);
    expect(r.status).toBe("safe");
  });

  it("moves through the status bands", () => {
    const s = spec(2, "years");
    const status = (today: string) => computeLimitation(s, { start: "2024-03-12", today }).status;
    expect(status("2026-02-20")).toBe("approaching");
    expect(status("2026-03-05")).toBe("urgent");
    expect(status("2026-03-12")).toBe("urgent");
    expect(status("2026-03-13")).toBe("expired");
  });

  it("clamps a leap day start", () => {
    expect(computeLimitation(spec(1, "years"), { start: "2024-02-29", today: "2024-03-01" }).deadline).toBe("2025-02-28");
  });

  it("offers the next open day when the last day is a Sunday", () => {
    const r = computeLimitation(spec(30, "days"), { start: "2026-10-02", today: "2026-10-20" });
    expect(r.deadline).toBe("2026-11-01");
    expect(r.extendedDeadline).toBe("2026-11-02");
    expect(r.daysRemaining).toBe(12);
    expect(r.status).toBe("urgent");
  });

  it("skips supplied closed dates", () => {
    const r = computeLimitation(spec(30, "days"), { start: "2026-10-02", today: "2026-10-20", closedDates: ["2026-11-02"] });
    expect(r.extendedDeadline).toBe("2026-11-03");
  });

  it("leaves out time spent in the wrong forum", () => {
    const r = computeLimitation(spec(3, "years"), {
      start: "2023-06-10",
      today: "2026-01-01",
      exclusions: [{ from: "2024-01-01", to: "2024-12-31" }]
    });
    expect(r.deadline).toBe("2027-06-11");
  });

  it("ignores exclusions that began before the period", () => {
    const r = computeLimitation(spec(3, "years"), {
      start: "2023-06-10",
      today: "2026-01-01",
      exclusions: [{ from: "2020-01-01", to: "2020-12-31" }]
    });
    expect(r.deadline).toBe("2026-06-10");
  });

  it("restarts the period on a timely acknowledgement", () => {
    const r = computeLimitation(spec(3, "years"), { start: "2023-06-10", today: "2026-01-01", acknowledgements: ["2025-02-01"] });
    expect(r.effectiveStart).toBe("2025-02-01");
    expect(r.deadline).toBe("2028-02-01");
  });

  it("ignores a late acknowledgement and rules that do not allow one", () => {
    const late = computeLimitation(spec(3, "years"), { start: "2023-06-10", today: "2026-01-01", acknowledgements: ["2027-01-01"] });
    expect(late.deadline).toBe("2026-06-10");
    const off = computeLimitation(spec(3, "years", { acknowledgementExtends: false }), {
      start: "2023-06-10",
      today: "2026-01-01",
      acknowledgements: ["2025-02-01"]
    });
    expect(off.deadline).toBe("2026-06-10");
  });

  it("gives recovery hints only when expired", () => {
    const expired = computeLimitation(spec(2, "years", { condonable: true }), { start: "2020-01-01", today: "2026-01-01" });
    expect(expired.status).toBe("expired");
    expect(expired.recoveryHints.some((h) => h.includes("sufficient cause"))).toBe(true);
    const plain = computeLimitation(spec(2, "years"), { start: "2020-01-01", today: "2026-01-01" });
    expect(plain.recoveryHints.some((h) => h.includes("sufficient cause"))).toBe(false);
    const live = computeLimitation(spec(2, "years"), { start: "2025-01-01", today: "2026-01-01" });
    expect(live.recoveryHints).toEqual([]);
  });

  it("rejects bad input", () => {
    expect(() => computeLimitation(spec(1, "years"), { start: "nope", today: "2026-01-01" })).toThrow();
    expect(() =>
      computeLimitation(spec(1, "years"), { start: "2025-01-01", today: "2025-06-01", exclusions: [{ from: "2025-03-01", to: "2025-02-01" }] })
    ).toThrow();
  });
});

describe("structured notes", () => {
  it("reports acknowledgements and excluded days", () => {
    const s = spec(3, "years");
    const r = computeLimitation(s, {
      start: "2023-06-10",
      today: "2026-01-01",
      acknowledgements: ["2025-02-01", "2029-01-01"],
      exclusions: [{ from: "2025-03-01", to: "2025-03-10" }]
    });
    expect(r.appliedAcknowledgement).toBe("2025-02-01");
    expect(r.ignoredAcknowledgements).toEqual(["2029-01-01"]);
    expect(r.excludedDays).toBe(10);
  });
});
