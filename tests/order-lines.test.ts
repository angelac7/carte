import { describe, expect, it } from "vitest";
import {
  blockedAddons,
  choiceLabels,
  dishQuantity,
  hasChoices,
  lineKey,
  linePrice,
  orderLines,
  parseLineKey,
} from "@/lib/order-lines";
import type { MenuItem } from "@/types/menu";

const ramen: MenuItem = {
  id: "ramen",
  name: "Ramen",
  description: "",
  price: "$14",
  allergens: ["wheat"],
  dietary_tags: [],
  notes: "",
  confirmed: true,
  sizes: [
    { label: "Regular", price: "$14" },
    { label: "Large", price: "$17.50" },
  ],
  addons: [
    { label: "Add egg", price: "$2", allergens: ["eggs"] },
    { label: "Extra scallion", price: "", allergens: [] },
    { label: "Add shrimp", price: "market", allergens: ["shellfish"] },
  ],
};
const tea: MenuItem = { ...ramen, id: "tea", name: "Tea", price: "$3", sizes: [], addons: [] };

describe("order lines", () => {
  it("keeps plain dishes keyed by their id, and gives each combination its own line", () => {
    expect(lineKey("tea")).toBe("tea");
    const key = lineKey("ramen", { size: 1, addons: [1, 0, 0] });
    expect(key).toBe("ramen|1|0.1");
    expect(parseLineKey(key)).toEqual({ dishId: "ramen", choice: { size: 1, addons: [0, 1] } });
    expect(parseLineKey("tea")).toEqual({ dishId: "tea", choice: { size: null, addons: [] } });
    expect(hasChoices(ramen)).toBe(true);
    expect(hasChoices(tea)).toBe(false);
  });

  it("prices a line from its size and add-ons", () => {
    expect(linePrice(ramen, { size: 1, addons: [0, 1] })).toBe(19.5);
    expect(linePrice(ramen, { size: null, addons: [] })).toBe(14);
    expect(linePrice(ramen, { size: 0, addons: [2] })).toBeNull();
  });

  it("lists lines in menu order, skipping choices the owner has since removed", () => {
    const order = { tea: 2, [lineKey("ramen", { size: 1, addons: [0] })]: 1, "ramen|5|": 1 };
    const lines = orderLines([ramen, tea], order);
    expect(lines.map((line) => line.dish.id)).toEqual(["ramen", "tea"]);
    expect(dishQuantity(order, "ramen")).toBe(2);
    expect(choiceLabels(ramen, lines[0].choice)).toEqual(["Large", "Add egg"]);
    expect(choiceLabels(ramen, lines[0].choice, ["Normal", "Grande", "Con huevo"])).toEqual([
      "Grande",
      "Con huevo",
    ]);
  });

  it("blocks add-ons with an allergen the diner avoids", () => {
    expect(blockedAddons(ramen, ["eggs", "shellfish"])).toEqual([0, 2]);
    expect(blockedAddons(ramen, [])).toEqual([]);
  });
});
