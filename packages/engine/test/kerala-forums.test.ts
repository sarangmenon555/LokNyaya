import { expect, it } from "vitest";
import { registry } from "../src/bundled";
import { routeForums } from "../src/forum";

const forums = registry.findRule("kl-tenancy", "deposit-refund")?.rule.forums ?? [];
const ids = (value: number) => routeForums(forums, value).map((f) => f.id);

it("sends claims up to 10 lakh to the Munsiff's Court and larger ones to the Sub Court", () => {
  expect(ids(1000000)).toEqual(["kl-munsiff-court", "lok-adalat"]);
  expect(ids(1000001)).toEqual(["kl-sub-court", "lok-adalat"]);
});
