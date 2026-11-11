import { describe, expect, it } from "vitest";
import { registry } from "../src/bundled";
import { lawsFor, splitActName } from "../src/laws";

function laws(packId: string, ruleId: string) {
  const found = registry.findRule(packId, ruleId);
  if (!found) throw new Error(`missing ${packId}/${ruleId}`);
  return lawsFor(found.pack, found.rule);
}

describe("splitActName", () => {
  it("separates the title from the year", () => {
    expect(splitActName("Limitation Act, 1963")).toEqual({ title: "Limitation Act", year: "1963" });
    expect(splitActName("Kerala Buildings (Lease and Rent Control) Act, 1965").title).toBe("Kerala Buildings (Lease and Rent Control) Act");
    expect(splitActName("Constitution")).toEqual({ title: "Constitution", year: null });
  });
});

describe("lawsFor", () => {
  it("names the central Act that sets a central deadline", () => {
    const [lead] = laws("limitation-act-1963-schedule", "art-55-breach-of-contract");
    expect(lead).toMatchObject({ title: "Limitation Act", year: "1963", level: "central", setsDeadline: true, provision: "Schedule, Article 55" });
    const [consumer] = laws("consumer-protection-act-2019", "goods-or-service");
    expect(consumer).toMatchObject({ year: "2019", provision: "Section 69" });
  });

  it("marks state Acts with their state and puts the deadline Act first", () => {
    const list = laws("tn-tenancy-2017", "deposit-refund");
    expect(list[0]).toMatchObject({ title: "Limitation Act", level: "central" });
    expect(list[1]).toMatchObject({ level: "state", jurisdictions: ["TN"], year: "2017", setsDeadline: false });
    const [appeal] = laws("tn-tenancy-2017", "appeal-to-rent-court");
    expect(appeal).toMatchObject({ level: "state", setsDeadline: true, provision: "section 33(2), as substituted in 2018" });
  });

  it("flags Keralam's civil courts Act as a state Act", () => {
    const list = laws("kl-tenancy", "deposit-refund");
    expect(list.find((l) => l.title === "Kerala Civil Courts Act")).toMatchObject({ level: "state", jurisdictions: ["KL"] });
  });
});
