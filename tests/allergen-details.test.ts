import { describe, expect, it } from "vitest";
import { filterDishes, mustLeaveOut, tracesOf } from "@/lib/menu-filters";
import type { MenuItem } from "@/types/menu";

const base: MenuItem = {
  id: "salad",
  name: "Salad",
  description: "",
  price: "",
  allergens: [],
  dietary_tags: [],
  notes: "",
  confirmed: true,
  allergen_list: 2,
};
const sesameSalad = {
  ...base,
  id: "sesame",
  allergens: ["sesame" as const],
  removable: ["sesame" as const],
};
const eggSalad = {
  ...base,
  id: "egg",
  allergens: ["eggs" as const, "sesame" as const],
  removable: ["sesame" as const],
};
const fries = { ...base, id: "fries", may_contain: ["shellfish" as const] };
const menu = [sesameSalad, eggSalad, fries];
const ids = (dishes: { id: string }[]) => dishes.map((dish) => dish.id);

describe("can be made without, and may contain", () => {
  it("stays strict by default, as every AI feature needs", () => {
    expect(ids(filterDishes(menu, { avoid: ["sesame", "shellfish"], onlyTags: [] }))).toEqual([]);
  });

  it("shows a dish on the menu when every avoided allergen can be left out", () => {
    // Both salads can drop their sesame, so a sesame allergy still sees them.
    const shown = filterDishes(menu, { avoid: ["sesame"], onlyTags: [] }, { allowRemovable: true });
    expect(ids(shown)).toEqual(["sesame", "egg", "fries"]);
    expect(mustLeaveOut(sesameSalad, ["sesame"])).toEqual(["sesame"]);
    // Eggs can't be left out, so the egg salad stays hidden for an egg allergy.
    const eggs = filterDishes(menu, { avoid: ["eggs"], onlyTags: [] }, { allowRemovable: true });
    expect(ids(eggs)).toEqual(["sesame", "fries"]);
  });

  it("warns about traces, or hides them for diners who ask", () => {
    const avoid = { avoid: ["shellfish" as const], onlyTags: [] };
    expect(ids(filterDishes(menu, avoid, { allowTraces: true }))).toContain("fries");
    expect(tracesOf(fries, ["shellfish"])).toEqual(["shellfish"]);
    expect(ids(filterDishes(menu, avoid, { allowTraces: false }))).not.toContain("fries");
  });
});
