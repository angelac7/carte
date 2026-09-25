import { describe, expect, it } from "vitest";
import { conflictingTags } from "@/lib/allergens";
import { filterDishes } from "@/lib/menu-filters";
import { tagConflictMessages } from "@/lib/tag-conflicts";
import { ExtractedDishSchema } from "@/types/menu";

describe("diet tags that a dish's allergens contradict", () => {
  it("finds impossible tags", () => {
    expect(conflictingTags(["fish", "eggs"], ["vegan", "gluten-free"])).toEqual(["vegan"]);
    expect(conflictingTags(["shellfish"], ["vegetarian", "kosher", "halal"])).toEqual([
      "vegetarian",
      "kosher",
    ]);
    expect(conflictingTags(["wheat"], ["gluten-free"])).toEqual(["gluten-free"]);
    expect(conflictingTags(["soy", "sesame"], ["vegan", "gluten-free"])).toEqual([]);
  });

  it("explains each conflict to the owner", () => {
    expect(tagConflictMessages(["fish", "eggs", "soy"], ["vegan"])).toEqual([
      "Remove “vegan”: this dish contains eggs and fish.",
    ]);
    expect(tagConflictMessages(["soy"], ["vegan"])).toEqual([]);
  });

  it("drops contradicted tags from the AI's suggestions", () => {
    const dish = ExtractedDishSchema.parse({
      name: "Toro Ssam Bap",
      likely_allergens: ["fish", "eggs", "soy"],
      dietary_tags: ["vegan", "gluten-free"],
    });
    expect(dish.dietary_tags).toEqual(["gluten-free"]);
  });

  it("never shows a contradicted dish to diners filtering by that tag", () => {
    const dishes = [
      { name: "Toro Ssam Bap", allergens: ["fish" as const], dietary_tags: ["vegan" as const] },
      { name: "Mushroom Ramyun", allergens: ["wheat" as const], dietary_tags: ["vegan" as const] },
    ];
    expect(filterDishes(dishes, { avoid: [], onlyTags: ["vegan"] }).map((d) => d.name)).toEqual([
      "Mushroom Ramyun",
    ]);
  });
});
