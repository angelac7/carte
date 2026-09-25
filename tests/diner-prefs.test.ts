import { describe, expect, it } from "vitest";
import { EMPTY_PREFS, parsePrefs, serializePrefs } from "@/lib/diner-prefs";

describe("diner preferences", () => {
  it("round-trips saved filters", () => {
    const prefs = {
      avoid: ["peanuts" as const, "wheat" as const],
      onlyTags: ["vegan" as const],
      hideTraces: true,
    };
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs);
  });

  it("ignores missing or garbled cookies", () => {
    expect(parsePrefs(undefined)).toEqual(EMPTY_PREFS);
    expect(parsePrefs("not json")).toEqual(EMPTY_PREFS);
    expect(parsePrefs(serializePrefs({ avoid: ["kiwi"], onlyTags: [] } as never))).toEqual(
      EMPTY_PREFS,
    );
  });
});
