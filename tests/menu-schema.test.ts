import { describe, expect, it } from "vitest";
import { ExtractedDishSchema, ExtractedMenuSchema } from "@/types/menu";

describe("ExtractedDishSchema", () => {
  it("keeps only known allergens and dietary tags", () => {
    const dish = ExtractedDishSchema.parse({
      name: "Mushroom Ramyun",
      likely_allergens: ["wheat", "celery", "milk"],
      dietary_tags: ["vegetarian", "keto"],
    });
    expect(dish.likely_allergens).toEqual(["wheat", "milk"]);
    expect(dish.dietary_tags).toEqual(["vegetarian"]);
  });

  it("turns numeric prices into text and fills in missing fields", () => {
    const dish = ExtractedDishSchema.parse({ name: "Toro Ssam Bap", price: 57 });
    expect(dish.price).toBe("57");
    expect(dish.description).toBe("");
    expect(dish.likely_allergens).toEqual([]);
  });
});

describe("ExtractedMenuSchema", () => {
  it("drops dishes that have no name", () => {
    const menu = ExtractedMenuSchema.parse({ items: [{ name: "Lobster Myun" }, { name: "  " }] });
    expect(menu.items.map((dish) => dish.name)).toEqual(["Lobster Myun"]);
  });
});
