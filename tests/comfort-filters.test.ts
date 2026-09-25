import { describe, expect, it } from "vitest";
import { priceSteps, startingPrice, withinComfort } from "@/lib/comfort-filters";

const dish = (id: string, price: string, spice: number | null, sizes: string[] = []) => ({
  id,
  price,
  spice,
  sizes: sizes.map((p, i) => ({ label: `Size ${i}`, price: p })),
});

describe("spice and price filters", () => {
  const menu = [
    dish("tea", "$3", 0),
    dish("salad", "$9", 1),
    dish("ramen", "$16", 3),
    dish("soup", "market", null),
    dish("noodles", "$18", 2, ["$12", "$18"]),
  ];

  it("uses a dish's cheapest size as its starting price", () => {
    expect(startingPrice(menu[4])).toBe(12);
    expect(startingPrice(menu[3])).toBeNull();
  });

  it("keeps dishes within limits, and those it can't judge", () => {
    const mild = withinComfort(menu, { maxSpice: 1, maxPrice: null }).map((d) => d.id);
    expect(mild).toEqual(["tea", "salad", "soup"]);
    const cheap = withinComfort(menu, { maxSpice: null, maxPrice: 15 }).map((d) => d.id);
    expect(cheap).toEqual(["tea", "salad", "soup", "noodles"]);
  });

  it("suggests round price steps that fit the menu's own currency", () => {
    expect(priceSteps([3, 9, 12, 16, 18])).toEqual([10, 15]);
    expect(priceSteps([800, 1200, 1500, 2400, 3800])).toEqual([1500, 2500]);
    expect(priceSteps([9, 12])).toEqual([]);
  });
});

describe("spice from menus and preferences", () => {
  it("clamps the spice level read from a menu photo, and leaves unreadable ones unset", async () => {
    const { ExtractedDishSchema } = await import("@/types/menu");
    expect(ExtractedDishSchema.parse({ name: "Ramen", spice: 5 }).spice).toBe(3);
    expect(ExtractedDishSchema.parse({ name: "Ramen", spice: "2" }).spice).toBe(2);
    expect(ExtractedDishSchema.parse({ name: "Ramen", spice: "very" }).spice).toBeNull();
    expect(ExtractedDishSchema.parse({ name: "Ramen" }).spice).toBeUndefined();
  });

  it("remembers the diner's spice limit, ignoring anything unexpected", async () => {
    const { EMPTY_PREFS, parsePrefs, serializePrefs } = await import("@/lib/diner-prefs");
    expect(parsePrefs(serializePrefs({ ...EMPTY_PREFS, maxSpice: 1 })).maxSpice).toBe(1);
    expect(parsePrefs(serializePrefs({ ...EMPTY_PREFS, maxSpice: 7 })).maxSpice).toBeUndefined();
  });
});
