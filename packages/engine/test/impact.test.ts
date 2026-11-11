import { describe, expect, it } from "vitest";
import { counterIncrements } from "../src/impact";

const context = {
  isKnownRule: (key: string) => key === "consumer-protection-act-2019/goods-or-service",
  isKnownState: (code: string) => code === "KL"
};
const rule = "consumer-protection-act-2019/goods-or-service";

describe("counterIncrements", () => {
  it("counts a check by status, rule and state", () => {
    expect(counterIncrements({ type: "check", rule, status: "urgent", state: "KL" }, context)).toEqual([
      ["checks", 1],
      ["status:urgent", 1],
      ["rule:" + rule, 1],
      ["state:KL", 1]
    ]);
  });

  it("counts follow-up outcomes and recovered rupees", () => {
    const out = counterIncrements({ type: "followup", outcome: "settled", recovered: 40000 }, context);
    expect(out).toContainEqual(["outcome:settled", 1]);
    expect(out).toContainEqual(["recovered_rupees", 40000]);
  });

  it("rejects unknown rules, unknown states, bad types and absurd amounts", () => {
    expect(counterIncrements({ type: "check", rule: "x/y", status: "safe" }, context)).toBeNull();
    expect(counterIncrements({ type: "check", rule, status: "safe", state: "ZZ" }, context)).toBeNull();
    expect(counterIncrements({ type: "other" }, context)).toBeNull();
    expect(counterIncrements({ type: "followup", outcome: "settled", recovered: 1e12 }, context)).toBeNull();
    expect(counterIncrements({ type: "followup", outcome: "settled", recovered: -5 }, context)).toBeNull();
  });
});
