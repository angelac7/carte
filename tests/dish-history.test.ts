import { describe, expect, it } from "vitest";
import {
  describeChange,
  latestEntryIds,
  withPrevious,
  type DishHistoryEntry,
  type DishSafety,
} from "@/lib/dish-history";

const safety = (overrides: Partial<DishSafety> = {}): DishSafety => ({
  allergens: [],
  may_contain: [],
  removable: [],
  dietary_tags: [],
  allergen_list: 2,
  addon_allergens: [],
  ...overrides,
});

const entry = (id: number, dish: string, overrides: Partial<DishHistoryEntry> = {}) =>
  ({
    id,
    menu_item_id: dish,
    dish_name: dish,
    action: "edited",
    changed_by: null,
    changed_at: "2026-09-25T12:00:00Z",
    safety: safety(),
    ...overrides,
  }) as DishHistoryEntry;

describe("describeChange", () => {
  it("lists what was added and removed in each part", () => {
    const lines = describeChange(
      safety({ allergens: ["wheat", "sesame"], dietary_tags: ["vegan"] }),
      safety({ allergens: ["wheat", "peanuts"], may_contain: ["sesame"] }),
    );
    expect(lines).toEqual([
      { label: "Contains", added: ["peanuts"], removed: ["sesame"], now: ["wheat", "peanuts"] },
      { label: "May contain", added: ["sesame"], removed: [], now: ["sesame"] },
      { label: "Diet labels", added: [], removed: ["vegan"], now: [] },
    ]);
  });

  it("notices add-on allergens that appear, change, or go away", () => {
    const before = safety({
      addon_allergens: [
        { label: "Egg", allergens: ["eggs"] },
        { label: "Sauce", allergens: ["soy"] },
      ],
    });
    const after = safety({
      addon_allergens: [
        { label: "Sauce", allergens: ["soy", "peanuts"] },
        { label: "Cheese", allergens: ["milk"] },
      ],
    });
    expect(
      describeChange(before, after).map((line) => [line.label, line.added, line.removed]),
    ).toEqual([
      ["Add-on “Sauce” contains", ["soy, peanuts"], ["soy"]],
      ["Add-on “Cheese” contains", ["milk"], []],
      ["Add-on “Egg” contains", [], ["eggs"]],
    ]);
  });

  it("finds nothing when a dish was only confirmed", () => {
    const same = safety({ allergens: ["milk"] });
    expect(describeChange(same, { ...same })).toEqual([]);
  });
});

describe("history lists", () => {
  // Newest first, as the page loads them.
  const entries = [entry(4, "soup"), entry(3, "tea"), entry(2, "soup"), entry(1, "tea")];

  it("pairs each change with the version before it for the same dish", () => {
    expect(
      withPrevious(entries).map(({ entry, previous }) => [entry.id, previous?.id ?? null]),
    ).toEqual([
      [4, 2],
      [3, 1],
      [2, null],
      [1, null],
    ]);
  });

  it("knows which entry is each dish's current version", () => {
    expect([...latestEntryIds(entries)]).toEqual([4, 3]);
  });
});
