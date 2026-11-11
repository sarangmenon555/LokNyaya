import { describe, expect, it } from "vitest";
import { forumSchema } from "../src/schema";
import { routeForums } from "../src/forum";

const forums = [
  forumSchema.parse({ id: "district", name: "District", minExclusive: 0, maxInclusive: 5000000 }),
  forumSchema.parse({ id: "state", name: "State", minExclusive: 5000000, maxInclusive: 20000000 }),
  forumSchema.parse({ id: "national", name: "National", minExclusive: 20000000, maxInclusive: null })
];

const ids = (value?: number) => routeForums(forums, value).map((f) => f.id);

describe("routeForums", () => {
  it("applies value bands with an inclusive upper bound", () => {
    expect(ids(5000000)).toEqual(["district"]);
    expect(ids(5000001)).toEqual(["state"]);
    expect(ids(20000000)).toEqual(["state"]);
    expect(ids(20000001)).toEqual(["national"]);
  });

  it("returns every forum when no value is given", () => {
    expect(ids()).toEqual(["district", "state", "national"]);
  });
});
