import { describe, expect, it } from "vitest";
import { buildDemandNotice } from "../src/draft";
import type { NoticeInput } from "../src/draft";

const base: NoticeInput = {
  senderName: "Asha Nair",
  senderAddress: "12 Lake Road",
  recipientName: "Metro Appliances",
  recipientAddress: "4 Market Street",
  matter: "Defective goods",
  facts: "I bought a refrigerator on 1 March that stopped working.",
  relief: "refund the price paid",
  act: "Consumer Protection Act, 2019",
  date: "16 October 2026",
  replyDays: 15
};

describe("buildDemandNotice", () => {
  it("includes every party, the facts and the deadline to reply", () => {
    const text = buildDemandNotice({ ...base, amount: 150000 });
    expect(text).toContain("LEGAL NOTICE");
    expect(text).toContain("Metro Appliances");
    expect(text).toContain("stopped working");
    expect(text).toContain("Rs. 1,50,000");
    expect(text).toContain("4. I therefore require you to refund the price paid within 15 days");
  });

  it("renumbers when there is no amount", () => {
    const text = buildDemandNotice(base);
    expect(text).not.toContain("The amount involved");
    expect(text).toContain("3. I therefore require you");
  });

  it("marks missing details with placeholders", () => {
    const text = buildDemandNotice({ ...base, senderName: " ", facts: "" });
    expect(text).toContain("[your name]");
    expect(text).toContain("[describe what happened, with dates]");
  });
});
