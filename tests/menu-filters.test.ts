import { describe, expect, it } from "vitest";
import { confirmedOnly, filterDishes } from "@/lib/menu-filters";
import type { MenuItem } from "@/types/menu";

function dish(overrides: Partial<MenuItem>): MenuItem {
  return {
    id: "1",
    name: "Dish",
    description: "",
    price: "",
    allergens: [],
    dietary_tags: [],
    notes: "",
    confirmed: true,
    ...overrides,
  };
}

const ramyun = dish({ id: "ramyun", allergens: ["wheat", "soy"] });
const salad = dish({ id: "salad", dietary_tags: ["vegan", "gluten-free"] });
const draft = dish({ id: "draft", confirmed: false });

const ids = (dishes: MenuItem[]) => dishes.map((d) => d.id);

describe("confirmedOnly", () => {
  it("never returns unconfirmed dishes", () => {
    expect(ids(confirmedOnly([ramyun, draft, salad]))).toEqual(["ramyun", "salad"]);
  });
});

describe("filterDishes", () => {
  it("returns every dish when no filters are set", () => {
    expect(ids(filterDishes([ramyun, salad], { avoid: [], onlyTags: [] }))).toEqual([
      "ramyun",
      "salad",
    ]);
  });

  it("hides dishes containing any avoided allergen", () => {
    expect(ids(filterDishes([ramyun, salad], { avoid: ["soy"], onlyTags: [] }))).toEqual(["salad"]);
  });

  it("keeps only dishes with every selected tag", () => {
    const vegan = dish({ id: "vegan-only", dietary_tags: ["vegan"] });
    expect(
      ids(filterDishes([salad, vegan], { avoid: [], onlyTags: ["vegan", "gluten-free"] })),
    ).toEqual(["salad"]);
  });
});
