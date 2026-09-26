import { describe, expect, it } from "vitest";
import { allergenCell, otherCell } from "@/lib/allergen-chart";
import { TABLE_STRINGS } from "@/lib/i18n/table-strings";
import { LANGUAGES } from "@/lib/languages";

const dish = {
  allergens: ["peanuts" as const, "sesame" as const],
  removable: ["sesame" as const],
  may_contain: ["tree nuts" as const],
  allergen_list: 2,
};

describe("allergen chart", () => {
  it("marks what a dish contains, what can be left out, and what may get in", () => {
    expect(allergenCell(dish, "peanuts")).toBe("contains");
    expect(allergenCell(dish, "sesame")).toBe("removable");
    expect(allergenCell(dish, "tree nuts")).toBe("may-contain");
    expect(allergenCell(dish, "milk")).toBe("none");
  });

  it("marks newer allergens as unchecked on dishes confirmed before them", () => {
    const older = { ...dish, allergen_list: 1 };
    expect(allergenCell(older, "mustard")).toBe("unchecked");
    expect(allergenCell(older, "milk")).toBe("none");
    expect(allergenCell({ ...older, allergens: ["mustard" as const] }, "mustard")).toBe("contains");
  });

  it("marks other things diners avoid only once the owner has checked them", () => {
    expect(otherCell({ also_contains: ["pork"], also_checked: true }, "pork")).toBe("contains");
    expect(otherCell({ also_contains: [], also_checked: true }, "pork")).toBe("none");
    expect(otherCell({}, "pork")).toBe("unchecked");
  });

  it("has its headings and key in every language", () => {
    for (const { code } of LANGUAGES) {
      const t = TABLE_STRINGS[code];
      for (const text of [
        t.chartTitle,
        t.chartIntro,
        t.chartDish,
        t.legendContains,
        t.legendRemovable,
        t.legendMayContain,
        t.legendUnchecked,
      ]) {
        expect(text).toBeTruthy();
      }
    }
  });
});
